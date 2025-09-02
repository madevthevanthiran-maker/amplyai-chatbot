    try {
      const resp = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: bootstrap.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data?.error || `HTTP ${resp.status}`;
        throw new Error(msg);
      }

      const data = await resp.json();
      const modelContent =
        data?.content ??
        data?.choices?.[0]?.message?.content ??
        "Sorry, I didn’t catch that.";
      setMessages((curr) => [
        ...curr,
        { id: newId(), role: "assistant", content: modelContent, ts: Date.now() },
      ]);
    } catch (e) {
      setError(
        (e && e.message) ||
          "Something went wrong. Please try again."
      );
      // analytics
      try { track("error", { tab: tabId, message: String(e?.message || e) }); } catch {}
    } finally {
      setLoading(false);
    }
