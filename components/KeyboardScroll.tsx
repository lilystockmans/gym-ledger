// One shared way to keep a focused text field above the Android keyboard.
// Same idea as the run screen: read the keyboard height from the Keyboard events, lift the screen by that
// height, then scroll the focused field into view. KeyboardAvoidingView is not used: with edge-to-edge
// Android it does not lift the screen reliably.
//
// Use KeyboardScroll inside a SafeAreaView that has the "bottom" edge. Inputs made with Field (components/plan/ui.tsx)
// are revealed automatically. A bare TextInput calls useRevealOnFocus().
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Dimensions, Keyboard, ScrollView, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Keyboard height in px (0 when hidden) and the screen y of its top edge. */
export function useKeyboard(): { height: number; top: number } {
  const [kb, setKb] = useState({ height: 0, top: 0 });
  useEffect(() => {
    const a = Keyboard.addListener("keyboardDidShow", (e) => setKb({ height: e.endCoordinates.height, top: e.endCoordinates.screenY }));
    const b = Keyboard.addListener("keyboardDidHide", () => setKb({ height: 0, top: 0 }));
    return () => { a.remove(); b.remove(); };
  }, []);
  return kb;
}

const RevealContext = createContext<() => void>(() => {});

/** Returns a function to call from a TextInput onFocus. It scrolls the field above the keyboard. */
export function useRevealOnFocus(): () => void {
  return useContext(RevealContext);
}

const GAP = 24; // free space kept between the field and the keyboard

export function KeyboardScroll({
  children,
  footer,
  contentStyle,
  style,
}: {
  children: ReactNode;
  /** Fixed bar under the list (for example a Save button). It rides on top of the keyboard. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const kb = useKeyboard();
  const insets = useSafeAreaInsets();
  const ref = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const kbTop = useRef(0);
  kbTop.current = kb.height > 0 ? (kb.top > 0 ? kb.top : Dimensions.get("window").height - kb.height) : 0;

  const reveal = useCallback(() => {
    // Wait one moment so the lifted layout has settled, then measure the focused field.
    setTimeout(() => {
      const limit = kbTop.current;
      if (limit === 0) return; // keyboard not up yet: the keyboard event calls this again
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input || typeof (input as { measureInWindow?: unknown }).measureInWindow !== "function") return;
      (input as unknown as { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void }).measureInWindow((_x, y, _w, h) => {
        const over = y + h + GAP - limit;
        if (over > 0) ref.current?.scrollTo({ y: scrollY.current + over, animated: true });
      });
    }, 120);
  }, []);

  useEffect(() => {
    if (kb.height > 0) reveal();
  }, [kb.height, reveal]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => { scrollY.current = e.nativeEvent.contentOffset.y; };

  // The screen sits inside a SafeAreaView with a bottom inset. The keyboard already covers that inset.
  const lift = Math.max(0, kb.height - insets.bottom);

  return (
    <RevealContext.Provider value={reveal}>
      <View style={[{ flex: 1, paddingBottom: lift }, style]}>
        <ScrollView ref={ref} onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={contentStyle}>
          {children}
        </ScrollView>
        {footer}
      </View>
    </RevealContext.Provider>
  );
}
