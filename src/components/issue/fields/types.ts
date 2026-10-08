/** Shared props: controlled (value/onValueChange) for the drawer, uncontrolled (defaultValue/name) for forms. */
export type SelectFieldProps<T> = {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};
