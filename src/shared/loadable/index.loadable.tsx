import { Suspense, type ComponentType } from "react";
import AppLoader from "../../components/loaders/app.loader";
import type { ReactNodeProps } from "../types/node.type";


const Loadable = <P extends object>(
  Component: ComponentType<P>
): React.FC<P & ReactNodeProps> => {
  return (props: P & ReactNodeProps) => (
    <Suspense fallback={<AppLoader />}>
      <Component {...props} />
    </Suspense>
  );
};

export default Loadable;
