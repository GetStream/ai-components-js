// AIDictation.mm

#import "AIDictation.h"
#import "AIComponentsReactNative-Swift.h"

@implementation AIDictation {
  AIDictationModule *_impl; // Swift implementation
}

- (instancetype)init {
  if (self = [super init]) {
    _impl = [AIDictationModule new];
  }
  return self;
}

+ (NSString *)moduleName {
  return @"NativeAIDictation"; // MUST match TS/Android name
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAIDictationSpecJSI>(params);
}

// Spec methods – just forward to Swift:
- (void)start:(JS::NativeAIDictation::DictationStartOptions &)options {
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];

      // --- interimResults: optional<bool> ---
      auto interimOpt = options.interimResults();        // whatever type codegen returns
      if (interimOpt.has_value()) {
        dict[@"interimResults"] = @(*interimOpt);
      }

      // --- language: optional<std::string> ---
      auto langOpt = options.language();
      if (langOpt && langOpt != (id)kCFNull) {
        dict[@"language"] = langOpt;
      }

      // --- silenceTimeoutMs: optional<double> ---
      auto silenceOpt = options.silenceTimeoutMs();
      if (silenceOpt.has_value()) {
        dict[@"silenceTimeoutMs"] = @(*silenceOpt);
      }

      // For debugging:
      // NSLog(@"[AIDictation] options dict = %@", dict);

      // Pass the serialized NSDictionary to Swift
      [_impl startWithOptions:dict eventEmitter:self];
}

- (void)stop {
  [_impl stop];
}

- (void)cancel {
  [_impl cancel];
}

- (BOOL)isRecording {
  return [_impl isRecording];
}

@end
