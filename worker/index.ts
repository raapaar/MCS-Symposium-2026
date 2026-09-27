interface Env {
  mcs_symposium_2026_media: R2Bucket;
  ASSETS: Fetcher;
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Storage API health check.
    if (url.pathname === "/api/storage/health") {
      const objects = await env.mcs_symposium_2026_media.list({
        limit: 1,
      });

      return Response.json({
        ok: true,
        service: "MCS Symposium R2 Storage",
        bucketConnected: true,
        objectCountChecked: objects.objects.length,
      });
    }

    // All non-API requests continue to the Vite application.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;