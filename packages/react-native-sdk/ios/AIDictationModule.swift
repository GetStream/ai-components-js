import Foundation
import Speech
import AVFoundation
import React

@objc public protocol AIDictationEventSink {
    func emitOnState(_ value: NSDictionary)
    func emitOnResult(_ value: NSDictionary)
    func emitOnError(_ value: NSDictionary)
}

@objc(AIDictationModule)
public class AIDictationModule: NSObject {

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    static let NAME = "NativeAIDictation"

    private let STATE_IDLE      = "idle"
    private let STATE_STARTING  = "starting"
    private let STATE_LISTENING = "listening"
    private let STATE_STOPPING  = "stopping"

    private let ERROR_NO_PERMISSION = "NO_PERMISSION"
    private let ERROR_NOT_AVAILABLE = "NOT_AVAILABLE"
    private let ERROR_INTERNAL      = "INTERNAL_ERROR"

    private let DEFAULT_SILENCE_TIMEOUT_MS: Double = 2500.0

    // -------------------------------------------------------------------------
    // Internal state
    // -------------------------------------------------------------------------
    
    private let audioEngine = AVAudioEngine()
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    private var isListening: Bool = false
    private var interimResultsEnabled: Bool = true
    private var currentLocale: Locale = .current
    private var silenceTimeoutMs: Double = 2500.0
    private var lastSpeechTimeMs: Double = 0.0

    private var silenceTimer: Timer?

    // -------------------------------------------------------------------------
    // Event emitter plumbing
    // -------------------------------------------------------------------------

    @objc public weak var eventSink: AIDictationEventSink?

    /// Called from Obj-C: [_impl startWithOptions:options eventEmitter:self];
    @objc(startWithOptions:eventEmitter:)
    public func startWithOptions(_ options: NSDictionary?, eventEmitter: NSObject) {
//        self.eventEmitter = RCTEventEmitter()
        start(options)
    }

    // -------------------------------------------------------------------------
    // NativeAIDictationSpec API
    // -------------------------------------------------------------------------

    /**
     * Starts a new dictation session with the given options.
     */
    @objc
    public func start(_ options: NSDictionary?) {
        if isListening {
            return
        }

        emitState(STATE_STARTING)

        interimResultsEnabled = (options?["interimResults"] as? Bool) ?? true

        if let languageTag = options?["language"] as? String,
           !languageTag.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            currentLocale = Locale(identifier: languageTag)
        } else {
            currentLocale = .current
        }

        if let silenceOpt = options?["silenceTimeoutMs"] as? Double, silenceOpt > 0 {
            silenceTimeoutMs = silenceOpt
        } else {
            silenceTimeoutMs = DEFAULT_SILENCE_TIMEOUT_MS
        }

        // Permissions
        if !hasAudioPermission() {
            requestPermissions { granted in
                if !granted {
                    self.emitError(self.ERROR_NO_PERMISSION,
                                   message: "Microphone or speech recognition permission not granted.")
                    self.emitState(self.STATE_IDLE)
                }
            }
            return
        }

        // Availability
        guard let recognizer = SFSpeechRecognizer(locale: currentLocale), recognizer.isAvailable else {
            emitError(
                ERROR_NOT_AVAILABLE,
                message: "Speech recognition is not available for this locale or on this device."
            )
            emitState(STATE_IDLE)
            return
        }

        speechRecognizer = recognizer

        DispatchQueue.main.async {
            do {
                try self.setupAudioSession()
                try self.startRecognition()
            } catch {
                self.isListening = false
                self.emitState(self.STATE_IDLE)
                self.emitError(
                    self.ERROR_INTERNAL,
                    message: "Failed to start recognition: \(error.localizedDescription)"
                )
            }
        }
    }

    /**
     * Requests a graceful stop of the current dictation session.
     */
    @objc
    public func stop() {
        if !isListening {
            return
        }

        emitState(STATE_STOPPING)
        stopSilenceMonitor()

        DispatchQueue.main.async {
            self.recognitionRequest?.endAudio()
        }
    }

    /**
     * Immediately cancels the current dictation session.
     */
    @objc
    public func cancel() {
        if !isListening {
            return
        }

        stopSilenceMonitor()

        DispatchQueue.main.async {
            self.stopAudioEngine()
            self.recognitionTask?.cancel()
            self.recognitionTask = nil
            self.recognitionRequest = nil
            self.isListening = false
            self.emitState(self.STATE_IDLE)
        }
    }

    /**
     * Synchronously reports whether a dictation session is currently active.
     */
    @objc
    public func isRecording() -> Bool {
        return isListening
    }

    // -------------------------------------------------------------------------
    // Internal setup / teardown
    // -------------------------------------------------------------------------

    private func setupAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
        try session.setActive(true, options: .notifyOthersOnDeactivation)
    }

    private func startRecognition() throws {
        // Clean up any previous task
        recognitionTask?.cancel()
        recognitionTask = nil

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = interimResultsEnabled
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) {
            [weak self] (buffer, _) in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        lastSpeechTimeMs = currentTimeMs()
        isListening = true
        emitState(STATE_LISTENING)

        startSilenceMonitor()

        recognitionTask = speechRecognizer?.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.lastSpeechTimeMs = self.currentTimeMs()
                    self.emitResult(text: text, isFinal: result.isFinal)
                }

                if result.isFinal {
                    self.finishRecognitionSession()
                }
            }

            if let error = error {
                self.stopSilenceMonitor()
                self.isListening = false
                self.emitError(
                    self.ERROR_INTERNAL,
                    message: "Speech recognizer error: \(error.localizedDescription)"
                )
                self.emitState(self.STATE_IDLE)
                self.stopAudioEngine()
                self.recognitionTask = nil
                self.recognitionRequest = nil
            }
        }
    }

    private func finishRecognitionSession() {
        stopSilenceMonitor()
        isListening = false
        emitState(STATE_IDLE)
        stopAudioEngine()
        recognitionTask = nil
        recognitionRequest = nil
    }

    /**
     * Fully tears down the recognizer and audio engine and resets state.
     */
    private func cleanupRecognizer() {
        stopSilenceMonitor()
        DispatchQueue.main.async {
            self.stopAudioEngine()
            self.recognitionTask?.cancel()
            self.recognitionTask = nil
            self.recognitionRequest = nil
            self.speechRecognizer = nil
            self.isListening = false
            self.emitState(self.STATE_IDLE)
        }
    }

    private func stopAudioEngine() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
    }

    // -------------------------------------------------------------------------
    // Permissions / silence monitor
    // -------------------------------------------------------------------------

    private func hasAudioPermission() -> Bool {
        let micAllowed = AVAudioSession.sharedInstance().recordPermission == .granted
        let speechAllowed = SFSpeechRecognizer.authorizationStatus() == .authorized
        return micAllowed && speechAllowed
    }
    
    private func requestPermissions(completion: @escaping (Bool) -> Void) {
        let audioSession = AVAudioSession.sharedInstance()

        audioSession.requestRecordPermission { micGranted in
            SFSpeechRecognizer.requestAuthorization { status in
                let speechGranted = (status == .authorized)
                DispatchQueue.main.async {
                    completion(micGranted && speechGranted)
                }
            }
        }
    }


    /**
     * Starts (or restarts) a rudimentary silence monitor.
     */
    private func startSilenceMonitor() {
        stopSilenceMonitor()

        guard silenceTimeoutMs > 0 else { return }

        silenceTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: true) { [weak self] _ in
            guard let self = self, self.isListening else { return }

            let elapsed = self.currentTimeMs() - self.lastSpeechTimeMs
            if elapsed >= self.silenceTimeoutMs {
                self.stop()
            }
        }
        if let timer = silenceTimer {
            RunLoop.main.add(timer, forMode: .common)
        }
    }

    /**
     * Stops the silence monitor by invalidating any pending timer.
     */
    private func stopSilenceMonitor() {
        silenceTimer?.invalidate()
        silenceTimer = nil
    }

    private func currentTimeMs() -> Double {
        return Date().timeIntervalSince1970 * 1000.0
    }

    // -------------------------------------------------------------------------
    // Event helpers
    // -------------------------------------------------------------------------

    private func emitResult(text: String, isFinal: Bool) {
        let payload: NSDictionary = [
            "text": text,
            "isFinal": isFinal
        ]
        eventSink?.emitOnResult(payload)
    }

    private func emitState(_ state: String) {
        let payload: NSDictionary = [
            "state": state
        ]
        eventSink?.emitOnState(payload)
    }

    private func emitError(_ code: String, message: String) {
        let payload: NSDictionary = [
            "code": code,
            "message": message
        ]
        eventSink?.emitOnError(payload)
    }

//    private func sendEventSafe(name: String, body: Any) {
////        if Thread.isMainThread {
////            DictationEventEmitter.emit(
////                            name,
////                            body: body
////                        )
//////            emitter.sendEvent(withName: name, body: body)
////        } else {
////            DispatchQueue.main.async {
////                DictationEventEmitter.emit(
////                                name,
////                                body: body
////                            )
//////                emitter.sendEvent(withName: name, body: body)
////            }
////        }
//        DictationEventEmitter.emit(
//                        name,
//                        body: body
//                    )
//    }
}
