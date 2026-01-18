import http from 'k6/http';
import { sleep, check } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js'

export const options = {
    scenarios: {
        load_test_100_users: {
            executor: 'constant-vus',
            vus: 100,
            duration: '2m',
            exec: 'loadTest',
        },
    },
    thresholds: {
        http_req_duration: [
            'p(50)<200',
            'p(95)<500',
            'p(99)<1000',
        ],
        http_req_failed: ['rate<0.01'],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export function loadTest() {
    const apiKey = __ENV.API_KEY;
    const url = 'https://reqres.in/api/users?page=1';

    const res = http.get(url, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'k6-load-test',
            'x-api-key': apiKey
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has data': (r) => r.json('data') !== undefined,
    });

    sleep(1);
}

export function handleSummary(data) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return {
      'results.html': htmlReport(data , {
        title: `K6 Load Test Report - ${timestamp}`
      }),
      stdout: textSummary(data, { indent: ' ', enableColors: true, }),
    }
}