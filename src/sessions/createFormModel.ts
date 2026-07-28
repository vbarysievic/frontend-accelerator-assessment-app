import type { SessionFormErrors, SessionFormValues } from './sessionDomain.ts'

export function preserveFormAfterFailure(
  values: SessionFormValues,
  failure: {
    message: string
    fieldErrors?: Record<string, string>
  },
): {
  values: SessionFormValues
  errors: SessionFormErrors
  formError: string
} {
  const errors = { ...failure.fieldErrors } as SessionFormErrors
  if (failure.fieldErrors?.startsAt) {
    errors.date = failure.fieldErrors.startsAt
    errors.startTime = failure.fieldErrors.startsAt
    delete (errors as Record<string, string | undefined>).startsAt
  }

  return {
    values: { ...values },
    errors,
    formError: failure.message,
  }
}
