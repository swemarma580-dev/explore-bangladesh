/* ==========================================================================
   delete-spot.js — permanent, complete deletion of a tourist spot
   --------------------------------------------------------------------------
   deleteTouristSpot(spotId) removes the WHOLE record by its unique ID from
   the storage layer (id, name, images, video, division, district, category,
   texts, coordinates, travel guidance, tips...). Media is stored inside the
   record, so no orphaned image/video data can remain.
   Then it cleans every reference to that ID:
     - other spots' "nearby attractions" lists
     - visitor favourites and recently-viewed lists
   and asks every page component to redraw from live data (homepage,
   search, division / district / category results, map markers, nearby
   lists, admin list, dashboard statistics). Nothing is merely hidden.

   data.js: confirmAndDelete() first asks the server to remove the spot from
   data.js (EB.Source.remove). Only when that succeeds is the record removed
   locally, so the browser and data.js never disagree. If the server is not
   running, nothing is deleted and an error is shown.
   ========================================================================== */
(function () {
  const EB = window.EB,
    U = EB.Util;

  function stripReferences(spotId) {
    const list = EB.Spots.all();
    let changed = false;
    list.forEach((s) => {
      const n = s.nearbyAttractions.filter((id) => id !== spotId);
      if (n.length !== s.nearbyAttractions.length) {
        s.nearbyAttractions = n;
        changed = true;
      }
    });
    if (changed) return EB.Spots.replaceAll(list).ok;
    return true;
  }

  /* Names mirror the checklist in the spec; each one just redraws a component */
  const refresh = {
    refreshTouristSpotList: () => EB.Refresh.run("adminList"),
    refreshHomepage: () => EB.Refresh.run("homepage"),
    refreshSearchResults: () => EB.Refresh.run("spots"),
    refreshDivisionResults: () => EB.Refresh.run("divisions"),
    refreshDistrictResults: () => EB.Refresh.run("districts"),
    refreshCategoryResults: () => EB.Refresh.run("explore"),
    refreshMapMarkers: () => {
      EB.Refresh.run("map");
      EB.Refresh.run("adminMap");
    },
    updateDashboardStatistics: () => EB.Refresh.run("dashboard"),
  };

  const Del = (EB.Delete = {
    refresh,

    /* opts.synced = true means data.js was already updated by the caller
       (confirmAndDelete), so only the local copy is removed here.
       Without it, EB.Spots.remove() removes locally and updates data.js too. */
    deleteTouristSpot(spotId, opts) {
      try {
        const spot = EB.Spots.get(spotId);
        if (!spot) return { ok: false, reason: "not_found" };

        const r =
          opts && opts.synced
            ? EB.Spots.removeLocal(spotId)
            : EB.Spots.remove(spotId); // 1. remove whole record by unique ID
        if (!r.ok) return { ok: false, reason: r.reason };
        stripReferences(spotId); // 2. nearby-attraction references
        EB.Favorites.remove(spotId); // 3. favourites
        EB.Recent.remove(spotId); // 4. recently viewed

        const left =
          EB.Spots.all().some(
            (s) => s.id === spotId || s.nearbyAttractions.includes(spotId),
          ) ||
          EB.Favorites.has(spotId) ||
          EB.Recent.has(spotId);
        if (left) return { ok: false, reason: "verify_failed" };

        Object.keys(refresh).forEach((k) => {
          try {
            refresh[k]();
          } catch (e) {
            console.error(k, e);
          }
        });
        EB.Refresh.all(); // details view, favourites, guide picker...
        return { ok: true, name: spot.name };
      } catch (e) {
        console.error("Delete failed", e);
        return { ok: false, reason: "exception" };
      }
    },

    /* Confirmation modal, then delete. opts.onDone(result) runs afterwards. */
    confirmAndDelete(spotId, opts) {
      opts = opts || {};
      const s = EB.Spots.get(spotId);
      if (!s) {
        U.toast("Tourist spot not found.", "error");
        if (opts.onDone) opts.onDone({ ok: false, reason: "not_found" });
        return;
      }
      const img = EB.Art.resolve(s.mainImage || EB.Art.forCategory(s.category));
      const m = U.modal(
        '<h2 class="h4" id="del-title">Are you sure you want to delete this tourist spot?</h2>' +
          '<div class="modal-summary"><img src="' +
          img +
          '" alt="' +
          U.esc(s.name) +
          '"><div><strong>' +
          U.esc(s.name) +
          "</strong><br>" +
          '<span class="muted">' +
          U.esc(s.district) +
          ", " +
          U.esc(s.division) +
          ' Division</span><br><span class="badge-eb badge-eb--cat mt-1">' +
          U.esc(s.category) +
          "</span></div></div>" +
          '<p class="modal-warning" role="alert">This action will permanently remove this tourist spot and all of its stored information.</p>' +
          '<div class="modal-actions"><button type="button" class="eb-btn eb-btn--ghost" data-close data-autofocus>Cancel</button>' +
          '<button type="button" class="eb-btn eb-btn--danger" data-confirm>Delete Permanently</button></div>',
        { label: "Confirm deletion of " + s.name },
      );
      const btn = m.el.querySelector("[data-confirm]");
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const sync = await EB.Source.remove(spotId); // update data.js first
        if (!sync.ok) {
          m.close();
          const res = { ok: false, reason: "source_failed" };
          U.toast(EB.Source.explain(sync), "error", 8000);
          if (opts.onDone) opts.onDone(res);
          return;
        }
        const res = Del.deleteTouristSpot(spotId, { synced: true });
        m.close();
        if (res.ok)
          U.toast(
            "Tourist spot deleted successfully (removed from data.js).",
            "success",
          );
        else
          U.toast(
            res.reason === "not_found"
              ? "Tourist spot not found."
              : "Unable to delete tourist spot. Please try again.",
            "error",
          );
        if (opts.onDone) opts.onDone(res);
      });
    },
  });
})();
