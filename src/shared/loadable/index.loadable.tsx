import { Suspense, type JSX } from 'react';
import AppLoader from '../../components/loaders/app.loader';

const Loadable = (Component: any) => (props: JSX.IntrinsicAttributes) => (
  <Suspense fallback={<AppLoader />}>
    <Component {...props} />
  </Suspense>
);


export default Loadable;
