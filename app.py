import sqlite3
from datetime import date
import pandas as pd
import streamlit as st
from html import escape

DB_PATH = "recepten.db"

# ---------- DB ----------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ingredients TEXT,
            instructions TEXT,
            tags TEXT,
            liked_by TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER NOT NULL,
            ate_on TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

def add_recipe(name, ingredients, instructions, tags, liked_by):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO recipes (name, ingredients, instructions, tags, liked_by)
        VALUES (?, ?, ?, ?, ?)
    """, (name, ingredients, instructions, tags, liked_by))
    conn.commit()
    conn.close()

def update_recipe(recipe_id, name, ingredients, instructions, tags, liked_by):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        UPDATE recipes
        SET name = ?, ingredients = ?, instructions = ?, tags = ?, liked_by = ?
        WHERE id = ?
    """, (name, ingredients, instructions, tags, liked_by, recipe_id))
    conn.commit()
    conn.close()

def get_recipes(query="", liked_filter=""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    sql = "SELECT id, name, ingredients, instructions, tags, liked_by FROM recipes"
    params, where = [], []
    if query:
        where.append("(name LIKE ? OR ingredients LIKE ? OR instructions LIKE ? OR tags LIKE ?)")
        q = f"%{query}%"
        params += [q, q, q, q]
    if liked_filter:
        where.append("liked_by LIKE ?")
        params.append(f"%{liked_filter}%")
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY name COLLATE NOCASE ASC"
    rows = c.execute(sql, params).fetchall()
    conn.close()
    return rows

def delete_recipe(recipe_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM recipes WHERE id = ?", (recipe_id,))
    conn.commit()
    conn.close()

def log_meal(recipe_id, ate_on, notes=""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO meals (recipe_id, ate_on, notes) VALUES (?, ?, ?)",
              (recipe_id, ate_on, notes))
    conn.commit()
    conn.close()

def get_meal_stats(recipe_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    total = c.execute("SELECT COUNT(*) FROM meals WHERE recipe_id = ?", (recipe_id,)).fetchone()[0]
    last = c.execute("SELECT ate_on FROM meals WHERE recipe_id = ? ORDER BY ate_on DESC LIMIT 1",
                     (recipe_id,)).fetchone()
    conn.close()
    last_date = last[0] if last else "—"
    return total, last_date

def export_table(table_name):
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
    conn.close()
    return df

# ---------- Helpers: badges + namen ----------
def render_badges_csv(csv_text: str) -> str:
    names = [n.strip() for n in (csv_text or "").split(",") if n.strip()]
    if not names:
        return ""
    spans = "".join(f'<span class="badge">{escape(n)}</span>' for n in names)
    return f'<div class="badges">{spans}</div>'

def _split_csv(csv_text: str):
    return [n.strip() for n in (csv_text or "").split(",") if n.strip()]

def _dedupe_keep_order(items):
    seen = set()
    out = []
    for x in items:
        k = x.strip()
        lk = k.lower()
        if lk and lk not in seen:
            seen.add(lk)
            out.append(k)
    return out

def get_all_likers():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    rows = c.execute("""
        SELECT liked_by FROM recipes
        WHERE liked_by IS NOT NULL AND TRIM(liked_by) <> ''
    """).fetchall()
    conn.close()
    names = set()
    for (csv_text,) in rows:
        for n in _split_csv(csv_text):
            names.add(n.strip())
    return sorted(names, key=lambda s: s.lower())

# ---------- UI ----------
st.set_page_config(page_title="🍳 Recepten & Eetlijst", layout="wide")
st.title("🍳 Recepten & Eetlijst")

# --- badges style ---
st.markdown("""
<style>
.badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
.badge {
  display:inline-block; padding:3px 10px; border-radius:999px;
  background:#d9e9b1; color:#2f5d1e; border:1px solid #9bb56b;
  font-weight:600; font-size:0.85rem; line-height:1.6;
}
</style>
""", unsafe_allow_html=True)

init_db()

# ---------- Nieuw recept ----------
with st.sidebar:
    st.header("➕ Nieuw recept")
    r_name = st.text_input("Naam *", key="new_name")
    r_ingredients = st.text_area("Ingrediënten (1 per regel)", key="new_ing")
    r_instructions = st.text_area("Bereiding / stappen", key="new_instr")
    r_tags = st.text_input("Tags/labels", key="new_tags", placeholder="pasta, snel, kids")

    existing_names = get_all_likers()
    selected_names = st.multiselect("Wie vindt dit lekker? (selecteer bestaande)",
                                    options=existing_names, key="new_selected_likers")
    new_likers_csv = st.text_input("Nieuwe naam/namen (optioneel, komma-gescheiden)",
                                   key="new_likers_csv", placeholder="bijv. tante, buurman")

    if st.button("Opslaan", type="primary", use_container_width=True):
        if r_name.strip():
            combined_likers = _dedupe_keep_order(list(selected_names) + _split_csv(new_likers_csv))
            liked_by_value = ", ".join(combined_likers)

            add_recipe(r_name.strip(), r_ingredients.strip(), r_instructions.strip(),
                       r_tags.strip(), liked_by_value)
            st.success("Recept opgeslagen.")

            # velden resetten
            st.session_state["new_name"] = ""
            st.session_state["new_ing"] = ""
            st.session_state["new_instr"] = ""
            st.session_state["new_tags"] = ""
            st.session_state["new_selected_likers"] = []
            st.session_state["new_likers_csv"] = ""

            st.rerun()
        else:
            st.warning("Naam is verplicht.")

    st.divider()
    st.header("📤 Export")
    if st.button("Exporteer recepten (CSV)", use_container_width=True):
        df = export_table("recipes")
        st.download_button("Download recepten.csv", df.to_csv(index=False).encode("utf-8"),
                           file_name="recepten.csv", mime="text/csv", use_container_width=True)
    if st.button("Exporteer eetmomenten (CSV)", use_container_width=True):
        df = export_table("meals")
        st.download_button("Download meals.csv", df.to_csv(index=False).encode("utf-8"),
                           file_name="meals.csv", mime="text/csv", use_container_width=True)

# ---------- Filters ----------
col_filters = st.columns([2, 1, 1])
with col_filters[0]:
    q = st.text_input("Zoek (naam/ingrediënten/bereiding/tags)")
with col_filters[1]:
    liked_filter = st.text_input("Filter op 'Wie vindt het lekker?' (bv. dochter)")

# ---------- Recepten lijst ----------
rows = get_recipes(query=q, liked_filter=liked_filter)
st.subheader(f"📋 Recepten ({len(rows)})")

if not rows:
    st.info("Nog geen recepten. Voeg er één toe via de zijbalk →")
else:
    for rid, name, ingredients, instructions, tags, liked_by in rows:
        with st.container(border=True):
            top = st.columns([0.55, 0.45])
            with top[0]:
                st.markdown(f"### {name}")
                if tags:
                    st.markdown("🏷️ Tags:", unsafe_allow_html=True)
                    st.markdown(render_badges_csv(tags), unsafe_allow_html=True)
                if liked_by:
                    st.markdown("❤️ Lekker:", unsafe_allow_html=True)
                    st.markdown(render_badges_csv(liked_by), unsafe_allow_html=True)

            with top[1]:
                total, last_date = get_meal_stats(rid)
                st.metric(label="Keer gegeten", value=total)
                st.metric(label="Laatst gegeten", value=last_date)

            # Tabs
            tabs = st.tabs(["Ingrediënten", "Bereiding", "Eetmoment loggen", "✏️ Bewerken", "Verwijderen"])

            with tabs[0]:
                st.text(ingredients or "—")
            with tabs[1]:
                st.text(instructions or "—")
            with tabs[2]:
                dcol1, dcol2 = st.columns([1, 2])
                with dcol1:
                    ate_on = st.date_input("Datum", value=date.today(), key=f"date-{rid}")
                with dcol2:
                    note = st.text_input("Notitie (optioneel)", key=f"note-{rid}")
                if st.button("Log eetmoment", key=f"log-{rid}"):
                    log_meal(rid, ate_on.isoformat(), note.strip())
                    st.success("Eetmoment toegevoegd.")
                    st.rerun()

            with tabs[3]:
                st.subheader("✏️ Recept bewerken")
                new_name = st.text_input("Naam *", value=name, key=f"edit_name_{rid}")
                new_ing = st.text_area("Ingrediënten", value=ingredients, key=f"edit_ing_{rid}")
                new_instr = st.text_area("Bereiding", value=instructions, key=f"edit_instr_{rid}")
                new_tags = st.text_input("Tags", value=tags, key=f"edit_tags_{rid}")

                existing_names = get_all_likers()
                selected_names = st.multiselect("Wie vindt dit lekker?",
                                                options=existing_names,
                                                default=_split_csv(liked_by),
                                                key=f"edit_likers_{rid}")
                new_likers_csv = st.text_input("Nieuwe naam/namen (optioneel, komma-gescheiden)",
                                               key=f"edit_new_likers_{rid}")

                if st.button("Opslaan wijzigingen", key=f"save_edit_{rid}"):
                    combined_likers = _dedupe_keep_order(selected_names + _split_csv(new_likers_csv))
                    liked_by_value = ", ".join(combined_likers)

                    update_recipe(rid, new_name.strip(), new_ing.strip(),
                                  new_instr.strip(), new_tags.strip(), liked_by_value)
                    st.success("Recept bijgewerkt.")
                    st.rerun()

            with tabs[4]:
                if st.button("Verwijder recept", key=f"del-{rid}"):
                    delete_recipe(rid)
                    st.warning("Recept verwijderd.")
                    st.rerun()
