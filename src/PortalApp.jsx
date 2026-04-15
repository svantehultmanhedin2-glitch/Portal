import React, { useEffect, useState } from "react";

/* =========================================================
   PERMISSIONS
   ======================================================= */
const canManageCatalog = (user) => user?.role === "admin";

/* =========================================================
   API HELPERS
   ======================================================= */
async function apiLoadUsers() {
  const r = await fetch("/api/users");
  if (!r.ok) throw new Error("Kunde inte läsa users");
  return (await r.json()) ?? [];
}
async function apiSaveUsers(users, user) {
  const r = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users, userRole: user?.role }),
  });
  if (!r.ok) throw new Error("Kunde inte spara users");
}

async function apiLoadTeams() {
  const r = await fetch("/api/teams");
  if (!r.ok) throw new Error("Kunde inte läsa teams");
  return (await r.json()) ?? [];
}
async function apiSaveTeams(teams, user) {
  const r = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teams, userRole: user?.role }),
  });
  if (!r.ok) throw new Error("Kunde inte spara teams");
}

async function apiLoadCatalog() {
  const r = await fetch("/api/catalog");
  if (!r.ok) throw new Error("Kunde inte läsa katalog");
  return (await r.json()) ?? [];
}
async function apiSaveCatalog(items, user) {
  const r = await fetch("/api/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, userRole: user?.role }),
  });
  if (!r.ok) throw new Error("Kunde inte spara katalog");
}

/* =========================================================
   NAV STATE (ingen router)
   ======================================================= */
const PAGES = {
  DASHBOARD: "dashboard",
  USERS: "users",
  TEAMS: "teams",
  CATALOG: "catalog",
};

/* =========================================================
   ROOT
   ======================================================= */
export default function PortalApp({ user }) {
  const [page, setPage] = useState(PAGES.DASHBOARD);

  return (
    <div className="app">
      {/* TOPBAR – exakt samma struktur/klasser som lagledarappen */}
      <header className="topbar">
        <div className="topbar__row">
          <div className="brand">
            <div className="brand__logo">SIF</div>
            <div className="brand__text">
              <div className="title">Adminportal</div>
              <div className="subtitle">
                Inloggad som {user?.name} · {user?.role}
              </div>
            </div>
          </div>

          <div className="actions">
            <button className="btn btn--ghost" onClick={() => setPage(PAGES.DASHBOARD)}>
              Dashboard
            </button>
            <button className="btn btn--ghost" onClick={() => setPage(PAGES.USERS)}>
              Users
            </button>
            <button className="btn btn--ghost" onClick={() => setPage(PAGES.TEAMS)}>
              Teams
            </button>
            <button className="btn btn--ghost" onClick={() => setPage(PAGES.CATALOG)}>
              Katalog
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="content">
        {page === PAGES.DASHBOARD && <Dashboard />}
        {page === PAGES.USERS && <UsersPage user={user} />}
        {page === PAGES.TEAMS && <TeamsPage user={user} />}
        {page === PAGES.CATALOG && <CatalogPage user={user} />}
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ======================================================= */
function Dashboard() {
  return (
    <section>
      <h2>Översikt</h2>
      <div className="card">
        Central administrationsportal för apparna.
      </div>
    </section>
  );
}

/* =========================================================
   USERS
   ======================================================= */

function UsersPage({ user }) {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    apiLoadUsers().then(setUsers).catch(console.error);
    apiLoadTeams().then(setTeams).catch(console.error);
  }, []);


  return (
    <section>
      <h2>Användare</h2>

      <button className="btn btn--primary" onClick={() => setEditing({})}>
        + Lägg till användare
      </button>

      <table className="table">
      
<thead>
  <tr>
    <th>Namn</th>
    <th>Roll</th>
    <th>Lag</th>
    <th />
  </tr>
</thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>
  {u.teamIds?.length
    ? u.teamIds.join(", ")
    : "—"}
</td>
              <td>
                <button className="btn btn--ghost" onClick={() => setEditing(u)}>
                  Redigera
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


{editing && (
  <Modal onClose={() => setEditing(null)}>
    <UserEditor
      portalUser={user}
      users={users}
      teams={teams}          // ✅
      user={editing}
      onSave={(next) => setUsers(next)}
      onClose={() => setEditing(null)}
    />
  </Modal>
)}

      
    </section>
  );
}

function UserEditor({ portalUser, users, teams, user, onSave, onClose }) {
  const [draft, setDraft] = useState({
    ...user,
    teamIds: Array.isArray(user.teamIds) ? user.teamIds : [],
  });

  const toggleTeam = (teamId) => {
    const has = draft.teamIds.includes(teamId);
    setDraft({
      ...draft,
      teamIds: has
        ? draft.teamIds.filter((id) => id !== teamId)
        : [...draft.teamIds, teamId],
    });
  };

  const save = async () => {
    const next = user.id
      ? users.map((u) => (u.id === user.id ? draft : u))
      : [...users, { ...draft, id: crypto.randomUUID() }];

    await apiSaveUsers(next, portalUser);
    onSave(next);
    onClose();
  };

  return (
    <>
      <h3>{user.id ? "Redigera användare" : "Ny användare"}</h3>

      <input
        placeholder="Namn"
        value={draft.name || ""}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />

      <select
        value={draft.role || "leader"}
        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
      >
        <option value="admin">Admin</option>
        <option value="leader">Ledare</option>
        <option value="inventory">Inventarie</option>
      </select>

      {/* ✅ Lagkoppling – endast relevant för ledare */}
      {draft.role === "leader" && (
        <div style={{ marginTop: 12 }}>
          <div className="label">Koppla lag</div>
          <div className="grid">
            {teams
              .filter((t) => t.active !== false)
              .map((t) => (
                <label
                  key={t.id}
                  className="card"
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={draft.teamIds.includes(t.id)}
                    onChange={() => toggleTeam(t.id)}
                  />
                  {t.name}
                </label>
              ))}
          </div>
        </div>
      )}

      <div className="actionsRow">
        <button className="btn btn--ghost" onClick={onClose}>
          Avbryt
        </button>
        <button className="btn btn--primary" onClick={save}>
          Spara
        </button>
      </div>
    </>
  );
}
/* =========================================================
   TEAMS
   ======================================================= */
function TeamsPage({ user }) {
  const [teams, setTeams] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    apiLoadTeams().then(setTeams).catch(console.error);
  }, []);

  return (
    <section>
      <h2>Lag</h2>

      <button className="btn btn--primary" onClick={() => setEditing({})}>
        + Lägg till lag
      </button>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Namn</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>
                <button className="btn btn--ghost" onClick={() => setEditing(t)}>
                  Redigera
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <TeamEditor
            portalUser={user}
            teams={teams}
            team={editing}
            onSave={(next) => setTeams(next)}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
    </section>
  );
}

function TeamEditor({ portalUser, teams, team, onSave, onClose }) {
  const [draft, setDraft] = useState(team);

  const save = async () => {
    const next = team.id
      ? teams.map((t) => (t.id === team.id ? draft : t))
      : [...teams, draft];

    await apiSaveTeams(next, portalUser);
    onSave(next);
    onClose();
  };

  return (
    <>
      <h3>{team.id ? "Redigera lag" : "Nytt lag"}</h3>
      <input
        placeholder="ID"
        value={draft.id || ""}
        onChange={(e) => setDraft({ ...draft, id: e.target.value })}
        disabled={!!team.id}
      />
      <input
        placeholder="Namn"
        value={draft.name || ""}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <div className="actionsRow">
        <button className="btn btn--ghost" onClick={onClose}>Avbryt</button>
        <button className="btn btn--primary" onClick={save}>Spara</button>
      </div>
    </>
  );
}

/* =========================================================
   CATALOG
   ======================================================= */
function CatalogPage({ user }) {
  const [catalog, setCatalog] = useState([]);
  const [editing, setEditing] = useState(null);
  const canEdit = canManageCatalog(user);

  useEffect(() => {
    apiLoadCatalog().then(setCatalog).catch(console.error);
  }, []);

  return (
    <section>
      <h2>Ledarkläder – Katalog</h2>

      {canEdit && (
        <button className="btn btn--primary" onClick={() => setEditing({})}>
          + Lägg till produkt
        </button>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>Kategori</th>
            <th>Pris</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {catalog.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.price} kr</td>
              <td>
                {canEdit && (
                  <button className="btn btn--ghost" onClick={() => setEditing(p)}>
                    Redigera
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && canEdit && (
        <Modal onClose={() => setEditing(null)}>
          <CatalogEditor
            portalUser={user}
            catalog={catalog}
            product={editing}
            onSave={(next) => setCatalog(next)}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
    </section>
  );
}

function CatalogEditor({ portalUser, catalog, product, onSave, onClose }) {
  const [draft, setDraft] = useState(product);

  const save = async () => {
    const next = product.id
      ? catalog.map((p) => (p.id === product.id ? draft : p))
      : [...catalog, { ...draft, id: crypto.randomUUID(), active: true }];

    await apiSaveCatalog(next, portalUser);
    onSave(next);
    onClose();
  };

  return (
    <>
      <h3>{product.id ? "Redigera produkt" : "Ny produkt"}</h3>
      <input
        placeholder="Namn"
        value={draft.name || ""}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <input
        placeholder="Kategori"
        value={draft.category || ""}
        onChange={(e) => setDraft({ ...draft, category: e.target.value })}
      />
      <input
        type="number"
        placeholder="Pris"
        value={draft.price || 0}
        onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
      />
      <div className="actionsRow">
        <button className="btn btn--ghost" onClick={onClose}>Avbryt</button>
        <button className="btn btn--primary" onClick={save}>Spara</button>
      </div>
    </>
  );
}

/* =========================================================
   MODAL (matchar lagledarappens CSS)
   ======================================================= */
function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}