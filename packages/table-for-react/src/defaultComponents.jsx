export function defaultButton(props) {
  return <button type="button" {...props} />;
}

export function defaultInput(props) {
  return <input {...props} />;
}

export function defaultCheckbox({ className, ...rest }) {
  return <input type="checkbox" className={className} {...rest} />;
}
