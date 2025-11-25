//
//  DictationEventEmitter.swift
//  AIComponentsReactNative
//
//  Created by Ivan Sekovanikj on 25.11.25.
//

import Foundation
import React

@objc(DictationEventEmitter)
class DictationEventEmitter: RCTEventEmitter {
    static var shared: DictationEventEmitter?

    override init() {
        super.init()
        DictationEventEmitter.shared = self
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return [
            "AIDictationResult",
            "AIDictationState",
            "AIDictationError"
        ]
    }

    @objc public static func emit(_ name: String, body: Any) {
        DispatchQueue.main.async {
            DictationEventEmitter.shared?.sendEvent(withName: name, body: body)
        }
    }
}

