import { useEffect, useId, useRef, useState } from 'react';
import './CourseHelp.css';

const initialValues = { name: '', email: '', topic: '', format: 'email', details: '' };
const fieldLabels = { name: 'Full name', email: 'Email', topic: 'Topic', details: 'Question' };

function validate(values) {
  const next = {};
  if (!values.name.trim()) next.name = 'Enter your name.';
  if (!values.email.trim()) next.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    next.email = 'Enter an email address such as name@example.com.';
  }
  if (!values.topic) next.topic = 'Choose a topic.';
  if (!values.details.trim()) next.details = 'Describe the question you need help with.';
  return next;
}

export default function CourseHelp() {
  const prefix = useId();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const summaryRef = useRef(null);
  const headingRef = useRef(null);
  const fieldRefs = useRef({});
  const fieldId = (name) => `${prefix}-${name}`;

  // A route change does not automatically announce a new page in a React app.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Course help | Web Programming';
    headingRef.current?.focus();
    return () => { document.title = previousTitle; };
  }, []);

  // The error summary must exist in the DOM before it can receive focus.
  useEffect(() => {
    if (submitAttempt > 0 && Object.keys(errors).length > 0) {
      summaryRef.current?.focus();
    }
  }, [submitAttempt, errors]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setStatus('');
    // Keep errors until the next submit, avoiding announcements on every keystroke.
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitAttempt((attempt) => attempt + 1);
    if (Object.keys(nextErrors).length > 0) {
      setStatus('');
      return;
    }
    setStatus(
      `Demo check ${submitAttempt + 1} complete. ` +
      'Your request passed validation. ' +
      'Nothing was sent or saved.'
    );
  }

  function inputProps(name) {
    return {
      id: fieldId(name), name, value: values[name], onChange: handleChange,
      required: true,
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': [
        `${fieldId(name)}-hint`,
        errors[name] && `${fieldId(name)}-error`,
      ].filter(Boolean).join(' '),
    };
  }

  function errorFor(name) {
    return errors[name] && (
      <p className="help-error" id={`${fieldId(name)}-error`}>
        Error: {errors[name]}
      </p>
    );
  }

  return (
    <div className="course-help">
      <header className="help-heading">
        <p className="help-eyebrow">CS418/518 · Web Programming</p>
        <h1 ref={headingRef} tabIndex={-1}>Course help request</h1>
        <p>Tell us where you need help and how you prefer to receive a reply.</p>
      </header>
      <div className="help-layout">
        <section aria-labelledby={fieldId('form-title')}>
          <h2 id={fieldId('form-title')}>Your request</h2>
          <p className="help-instructions">Fields marked “required” must be completed. Use sample information for this demonstration.</p>
          <form noValidate onSubmit={handleSubmit}>
            {Object.keys(errors).length > 0 && (
              <section className="help-summary" ref={summaryRef} tabIndex={-1}
                aria-labelledby={fieldId('error-title')}>
                <h3 id={fieldId('error-title')}>Please correct {Object.keys(errors).length} fields</h3>
                <p>Follow a link to a field, correct it, then submit again.</p>
                <ul>
                  {Object.entries(errors).map(([name, message]) => (
                    <li key={name}>
                      <a href={`#${fieldId(name)}`} onClick={(event) => {
                        event.preventDefault();
                        fieldRefs.current[name]?.focus();
                      }}>{fieldLabels[name]}: {message}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="help-fields">
              <div className="help-field">
                <label htmlFor={fieldId('name')}>Full name (required)</label>
                <p id={`${fieldId('name')}-hint`}>Use the name you want us to use.</p>
                <input {...inputProps('name')} autoComplete="name"
                  ref={(node) => { fieldRefs.current.name = node; }} />
                {errorFor('name')}
              </div>
              <div className="help-field">
                <label htmlFor={fieldId('email')}>Email (required)</label>
                <p id={`${fieldId('email')}-hint`}>For example, name@example.com.</p>
                <input {...inputProps('email')} type="email" autoComplete="email"
                  ref={(node) => { fieldRefs.current.email = node; }} />
                {errorFor('email')}
              </div>
            </div>
            <div className="help-field">
              <label htmlFor={fieldId('topic')}>Topic (required)</label>
              <p id={`${fieldId('topic')}-hint`}>Choose the area closest to your question.</p>
              <select {...inputProps('topic')} ref={(node) => { fieldRefs.current.topic = node; }}>
                <option value="">Choose a topic</option>
                <option value="react">React components and state</option>
                <option value="accessibility">Web accessibility</option>
                <option value="responsive">Responsive CSS</option>
              </select>
              {errorFor('topic')}
            </div>
            <fieldset className="help-format">
              <legend>Preferred reply format</legend>
              {['email', 'office-hours'].map((format) => (
                <label key={format}>
                  <input type="radio" name="format" value={format}
                    checked={values.format === format} onChange={handleChange} />
                  {format === 'email' ? 'Email explanation' : 'Discuss during office hours'}
                </label>
              ))}
            </fieldset>
            <div className="help-field">
              <label htmlFor={fieldId('details')}>Question (required)</label>
              <p id={`${fieldId('details')}-hint`}>Explain what you expected and what happened. Do not include passwords.</p>
              <textarea {...inputProps('details')} rows={4}
                ref={(node) => { fieldRefs.current.details = node; }} />
              {errorFor('details')}
            </div>
            <div className="help-actions">
              <button type="submit">Check request</button>
              <p>Demonstration only. No request is sent.</p>
            </div>
            <p className="help-status" role="status" aria-atomic="true">{status}</p>
          </form>
        </section>
        <aside className="help-aside" aria-labelledby={fieldId('about-title')}>
          <h2 id={fieldId('about-title')}>About this demo</h2>
          <p>This form runs entirely in your browser. It does not use the server, send email, or store your information.</p>
          <p>Keyboard users can move through controls with Tab and Shift+Tab. Arrow keys change the selected reply format.</p>
          <p>The layout adjusts to the available width. All instructions and controls remain available on a narrow screen.</p>
        </aside>
      </div>
    </div>
  );
}
