import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = 'http://127.0.0.1:3000/api';

const EMAIL = 'test@datashare.local';
const PASSWORD = '12345678';

// Métriques spécifiques à chaque endpoint
const loginDuration = new Trend('login_duration', true);
const filesDuration = new Trend('files_duration', true);
const uploadDuration = new Trend('upload_duration', true);

const loginRequests = new Counter('login_requests');
const filesRequests = new Counter('files_requests');
const uploadRequests = new Counter('upload_requests');

export const options = {
  scenarios: {
    login: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10s',
      exec: 'loginScenario',
    },

    files: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10s',
      exec: 'filesScenario',
      startTime: '12s',
    },

    upload: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10s',
      exec: 'uploadScenario',
      startTime: '24s',
    },
  },
};

export function setup() {
  const payload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const response = http.post(`${BASE_URL}/auth/login`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'setup login status is 201': (r) => r.status === 201,
    'setup login returns accessToken': (r) =>
      r.json('accessToken') !== undefined,
  });

  if (response.status !== 201) {
    throw new Error(`Login setup failed with status ${response.status}`);
  }

  return {
    token: response.json('accessToken'),
  };
}

export function loginScenario() {
  const payload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const response = http.post(`${BASE_URL}/auth/login`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  loginRequests.add(1);
  loginDuration.add(response.timings.duration);

  check(response, {
    'login status is 201': (r) => r.status === 201,
    'login returns accessToken': (r) =>
      r.json('accessToken') !== undefined,
  });
}

export function filesScenario(data) {
  const response = http.get(`${BASE_URL}/files`, {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  });

  filesRequests.add(1);
  filesDuration.add(response.timings.duration);

  check(response, {
    'files status is 200': (r) => r.status === 200,
    'files returns JSON': (r) =>
      r.headers['Content-Type']?.includes('application/json'),
  });
}

export function uploadScenario(data) {
  const payload = JSON.stringify({
    fileName: 'performance-test.txt',
    size: 1024,
    mimeType: 'text/plain',
    expirationDays: 7,
  });

  const response = http.post(`${BASE_URL}/uploads`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  });

  uploadRequests.add(1);
  uploadDuration.add(response.timings.duration);

  check(response, {
    'upload status is 201': (r) => r.status === 201,
    'upload returns uploadId': (r) =>
      r.json('uploadId') !== undefined,
    'upload returns uploadUrl': (r) =>
      r.json('uploadUrl') !== undefined,
  });
}