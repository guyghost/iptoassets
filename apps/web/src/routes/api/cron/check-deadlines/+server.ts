import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { checkDeadlineNotifications } from "$lib/server/use-cases";
import { orgRepo } from "$lib/server/repositories";

export const POST: RequestHandler = async (event) => {
	const authHeader = event.request.headers.get("authorization");
	const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null;

	if (!expected || authHeader !== expected) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const organizations = await orgRepo.findAll();
	let totalNotifications = 0;

	for (const org of organizations) {
		const result = await checkDeadlineNotifications(org.id);
		if (result.ok) {
			totalNotifications += result.value;
		}
	}

	return json({ notificationsCreated: totalNotifications });
};
