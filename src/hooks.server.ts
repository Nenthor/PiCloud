import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';

// Executes before route specific hooks
export const handle: Handle = (async ({ resolve, event }) => {
	if (event.url.pathname === '/') {
		redirect(301, '/cloud');
	}

	return await resolve(event);
}) satisfies Handle;

// Executes when an error is thrown in a route. Ignores 404 errors
export const handleError: HandleServerError = (async ({ error, status, message }) => {
	if (status === 404) {
		console.log(`${error}`.split('\n')[0].replace('Error:', '404'));
	} else console.error(error);

	return {
		message,
		status
	};
}) satisfies HandleServerError;
