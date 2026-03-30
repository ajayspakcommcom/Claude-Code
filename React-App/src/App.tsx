import JSXDemo from "./react-basics/01_JSX";
import FunctionalComponentsDemo from "./react-basics/02_FunctionalComponents";
import PropsVsStateDemo from "./react-basics/03_PropsVsState";
import EventsAndConditionalDemo from "./react-basics/04_EventsAndConditionalRendering";
import ListsAndKeysDemo from "./react-basics/05_ListsAndKeys";
import BasicFormsDemo from "./react-basics/06_BasicForms";

import UseStateDemo from "./hooks/01_useState";
import UseEffectDemo from "./hooks/02_useEffect";
import UseRefDemo from "./hooks/03_useRef";
import UseMemoDemo from "./hooks/04_useMemo";
import UseCallbackDemo from "./hooks/05_useCallback";
import UseContextDemo from "./hooks/06_useContext";
import UseReducerDemo from "./hooks/07_useReducer";
import UseLayoutEffectDemo from "./hooks/08_useLayoutEffect";
import UseImperativeHandleDemo from "./hooks/09_useImperativeHandle";
import UseIdDemo from "./hooks/10_useId";
import UseTransitionDemo from "./hooks/11_useTransition";
import UseDeferredValueDemo from "./hooks/12_useDeferredValue";
import UseDebugValueDemo from "./hooks/13_useDebugValue";
import UseSyncExternalStoreDemo from "./hooks/14_useSyncExternalStore";
import UseInsertionEffectDemo from "./hooks/15_useInsertionEffect";

import UseFetchDemo from "./hooks/custom/01_useFetch";
import UseLocalStorageDemo from "./hooks/custom/02_useLocalStorage";
import UseDebounceDemo from "./hooks/custom/03_useDebounce";
import UseWindowSizeDemo from "./hooks/custom/04_useWindowSize";
import UsePreviousDemo from "./hooks/custom/05_usePrevious";
import UseClickOutsideDemo from "./hooks/custom/06_useClickOutside";
import UseToggleDemo from "./hooks/custom/07_useToggle";
import UseFormDemo from "./hooks/custom/08_useForm";

const App = () => {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>

      <h1>React Basics</h1>
      <hr />
      <section><JSXDemo /></section>
      <hr />
      <section><FunctionalComponentsDemo /></section>
      <hr />
      <section><PropsVsStateDemo /></section>
      <hr />
      <section><EventsAndConditionalDemo /></section>
      <hr />
      <section><ListsAndKeysDemo /></section>
      <hr />
      <section><BasicFormsDemo /></section>

      <h1>Hooks</h1>
      <hr />
      <section><UseStateDemo /></section>
      <hr />
      <section><UseEffectDemo /></section>
      <hr />
      <section><UseRefDemo /></section>
      <hr />
      <section><UseMemoDemo /></section>
      <hr />
      <section><UseCallbackDemo /></section>
      <hr />
      <section><UseContextDemo /></section>
      <hr />
      <section><UseReducerDemo /></section>
      <hr />
      <section><UseLayoutEffectDemo /></section>
      <hr />
      <section><UseImperativeHandleDemo /></section>
      <hr />
      <section><UseIdDemo /></section>
      <hr />
      <section><UseTransitionDemo /></section>
      <hr />
      <section><UseDeferredValueDemo /></section>
      <hr />
      <section><UseDebugValueDemo /></section>
      <hr />
      <section><UseSyncExternalStoreDemo /></section>
      <hr />
      <section><UseInsertionEffectDemo /></section>

      <h1>Custom Hooks</h1>
      <hr />
      <section><UseFetchDemo /></section>
      <hr />
      <section><UseLocalStorageDemo /></section>
      <hr />
      <section><UseDebounceDemo /></section>
      <hr />
      <section><UseWindowSizeDemo /></section>
      <hr />
      <section><UsePreviousDemo /></section>
      <hr />
      <section><UseClickOutsideDemo /></section>
      <hr />
      <section><UseToggleDemo /></section>
      <hr />
      <section><UseFormDemo /></section>

    </div>
  );
};

export default App;
