# Frontend Engineering Rules

Use React with functional components.

Use React Router for navigation.

Use Axios for API communication.

Use React Hook Form for complex forms.

Use reusable components.

## Component Rules

Avoid components larger than necessary.

If a component becomes difficult to understand, split it.

## State

Use Context only for global state such as authentication.

Do not put every piece of application state into Context.

## API

All API requests should go through service modules.

Components should not contain raw axios calls.

## UI States

Every API-driven screen should support:

- loading
- success
- empty
- error

## Forms

All forms must:

- validate input
- show useful errors
- prevent duplicate submission
- show loading state
- show success/error feedback

## Responsive Design

The application must work on:

- desktop
- tablet
- mobile

## Accessibility

Use:

- semantic HTML
- labels
- keyboard navigation
- accessible buttons
- appropriate contrast