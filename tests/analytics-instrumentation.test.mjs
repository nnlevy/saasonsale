import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const analyticsSource = readFileSync(
  new URL('../src/react-app/services/analytics.ts', import.meta.url),
  'utf8',
);

const appSource = readFileSync(
  new URL('../src/react-app/App.tsx', import.meta.url),
  'utf8',
);

const workerSource = readFileSync(
  new URL('../src/worker/index.ts', import.meta.url),
  'utf8',
);

test('analytics service exposes the extended event set', () => {
  for (const eventName of [
    'page_view',
    'form_start',
    'form_complete',
    'credit_pack_view',
    'checkout_start',
    'payment_result',
  ]) {
    assert.match(analyticsSource, new RegExp(`"${eventName}"`));
  }

  assert.match(analyticsSource, /export const trackPageView =/);
  assert.match(analyticsSource, /export const trackFormComplete =/);
  assert.match(analyticsSource, /export const trackCreditPackView =/);
  assert.match(analyticsSource, /export const trackCheckoutStart =/);
  assert.match(analyticsSource, /export const trackPaymentResult =/);
  assert.match(analyticsSource, /trackFormComplete\(formId, metadata\)/);
  assert.match(analyticsSource, /window\.location\.search \|\| ""/);
  assert.match(analyticsSource, /delete sanitizedMetadata\.path/);
  assert.match(analyticsSource, /metadata: \{ \.\.\.metadata, result \}/);
});

test('app wires the funnel analytics touchpoints', () => {
  assert.match(appSource, /trackPageView\(/);
  assert.match(appSource, /trackFormStart\("onboarding_questions"/);
  assert.match(appSource, /trackFormSubmit\("onboarding_questions"/);
  assert.match(appSource, /trackCreditPackView\("doting_credits"/);
  assert.match(appSource, /trackCheckoutStart\("doting_credits"/);
  assert.match(appSource, /trackPaymentResult\("doting_credits", "success"/);
  assert.match(appSource, /trackPaymentResult\("doting_credits", "error"/);
});

test('worker accepts the new events while keeping legacy form_submit', () => {
  for (const eventName of [
    'page_view',
    'form_start',
    'form_complete',
    'credit_pack_view',
    'checkout_start',
    'payment_result',
    'form_submit',
  ]) {
    assert.match(workerSource, new RegExp(`"${eventName}"`));
  }
});

test('trackFormSubmit remains an alias for form_complete', () => {
  assert.match(analyticsSource, /export const trackFormSubmit =/);
  assert.match(analyticsSource, /trackFormComplete\(formId, metadata\)/);
});
