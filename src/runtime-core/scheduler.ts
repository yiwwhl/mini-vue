const queue: any[] = [];
let isFlushPending = false;

export function queueJobs(job) {
	if (!queue.includes(job)) {
		queue.push(job);
	}
	queueFlush();
}

function queueFlush() {
	if (isFlushPending) return;
	isFlushPending = true;

	nextTick(() => {
		isFlushPending = false;
		let job;
		while ((job = queue.shift())) {
			job && job();
		}
	});
}

const microtask = Promise.resolve();

export function nextTick(fn) {
	return fn ? microtask.then(fn) : microtask;
}
