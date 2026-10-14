import { useState } from 'react';

/**
 * Hook per form con validazione "touched": gli errori compaiono
 * solo dopo che il campo è stato modificato o al primo submit.
 *
 * Il form va remountato (attraverso `key`) quando cambia la voce in modifica.
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const showError = (field) => Boolean(errors[field]) && (submitted || touched[field]);

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const touch = (field) => setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = (onValid) => (event) => {
    event?.preventDefault?.();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) onValid(values);
  };

  return {
    values,
    errors,
    isValid: Object.keys(errors).length === 0,
    showError,
    setField,
    touch,
    handleSubmit,
  };
}
