import type { ViewProps } from 'react-native';
import type { Float, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type ColorRange = {
  start: Int32;
  end: Int32;
  color: Int32; // processed to Android int on JS side
};

export interface NativeProps extends ViewProps {
  text: string;
  colorRanges?: ReadonlyArray<ColorRange>;
  fontSize?: Float;
  fontFamily?: string;
  lineHeight?: Float;
}

export default codegenNativeComponent<NativeProps>('PerfText');
