import { NavLink } from 'react-router-dom';

import { type AppRoute } from '~/libs/enums/enums.js';
import { type ValueOf } from '~/libs/types/types.js';

type Properties = {
  to: ValueOf<typeof AppRoute>;
  children: React.ReactNode;
  className?: string;
};

const Link: React.FC<Properties> = ({
  children,
  to,
  className,
}: Properties) => (
  <NavLink to={to} className={className ?? 'link'}>
    {children}
  </NavLink>
);

export { Link };
