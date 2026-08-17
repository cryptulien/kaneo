#!/usr/bin/env python3
"""Link existing Kaneo tasks into expandable epics. Idempotent."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path

TOKEN = Path("/root/.config/superpagr/kaneo-api-key").read_text().strip()
BASE = "http://127.0.0.1:3064/api"
EPIC_LABEL = "rzlaz8hajzk9hpxyff84vnq9"


def req(method: str, path: str, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8", "replace")
        if exc.code == 409:
            return {"already": True, "body": payload}
        raise RuntimeError(f"{method} {path} -> {exc.code} {payload[:300]}") from exc


def create_task(project_id: str, title: str, status: str, description: str) -> str:
    created = req(
        "POST",
        f"/task/{project_id}",
        {
            "title": title,
            "description": description,
            "priority": "high",
            "status": status,
        },
    )
    task_id = created["id"]
    req("PUT", f"/label/{EPIC_LABEL}/task", {"taskId": task_id})
    return task_id


def link(parent: str, child: str) -> None:
    if parent == child:
        return
    req(
        "POST",
        "/task-relation",
        {
            "sourceTaskId": parent,
            "targetTaskId": child,
            "relationType": "subtask",
        },
    )


def label(task_id: str) -> None:
    req("PUT", f"/label/{EPIC_LABEL}/task", {"taskId": task_id})


def main() -> None:
    # Existing epic-like parents
    admin = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Admin dashboard & mesure",
        "in-review",
        "Regroupe Pouls, pages d'analyse, socle de mesure et accès analytics.",
    )
    orgs = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Organisations",
        "to-do",
        "Liste, création, sidebar et rattachement hôpital/workspace.",
    )
    auth = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Signup, login et onboarding compte",
        "to-do",
        "Parcours d'entrée : signup, login, hydratation, polish visuel.",
    )
    exchanges = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Échanges et dons",
        "to-do",
        "Acceptation, annulation, validation, échanges sur shift passé.",
    )
    publication = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Publication des plannings",
        "in-review",
        "Fenêtres de publication, invariant publié, nettoyage legacy.",
    )
    notifs = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Notifications",
        "to-do",
        "Push, email, préférences, séparation alerte / À traiter.",
    )
    solver = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Solveur OR-Tools",
        "in-review",
        "Règles mortes à câbler, quotas, week-ends, étalement.",
    )
    assistant = create_task(
        "k6hzgaic6wjw09dsuo8ofwsq",
        "Épopée — Assistant / suggestions (E7)",
        "backlog",
        "Suggestion RAG, auto-spec, assistant admin.",
    )
    onboarding = "ir3x8yfx1dnteax8vanzyuhq"
    rh = "v8gp4lnehgvfsoxp6q4vykwa"
    label(onboarding)
    label(rh)

    groups = {
        admin: [
            "r9c7zldsrufojqsrfwgf9hxe",
            "t2vli0o208cewbtj9vlkui9i",
            "fue6keg3v5f2m7yu979pznu0",
            "fb1gwecl3dclf444q3x3ip0i",
            "vg7lvnjiy1qtm85556yx4550",
            "mug2lk3y8livngb7v72h8ixt",
            "eqr78u9cyuk5cgzlv8mfepga",
            "aajtb55gr43osu9ucued5wiy",
            "cj5kj4ob08txsdvnoza135p6",
        ],
        orgs: [
            "wzrzeomql4w2dohyd2xk17eq",
            "kin7dnqvg4h090nkd08ju834",
            "dozz6xfrdw87sa0w1djqyd44",
            "edh7rx6wojv3slqfldt7s9o3",
            "nqz0obup111qinmu7r4k7cto",
        ],
        auth: [
            "i6u3s5w268a2ycckl7q6kjg5",
            "y42vqp3poimpt7jt5yle1qcj",
            "v1yiisf0u8pa08zraq3v7z5i",
            "gpgdenc5wmcj2jrodnrzgh9n",
        ],
        exchanges: [
            "gl6tfuqqu1innrq49m4zwar7",
            "sj7gbap7as48q2qg3tgw3p60",
            "of0ckiy00nuk9v76mvhv2ykm",
            "yrsgrz9oiv61mbz3nzxx5j4r",
            "yxmj8stc9lhjk09nvxp1os6w",
            "f94s40wsx9rl3k91x3mj9kof",
        ],
        publication: [
            "ifiyuslta7s5ltfsgkequp8t",
            "eosnxvl89a7eshpi41f0rczl",
            "h9ma7hr69omswtvvb59qmz2g",
            "so1kaw73t8wcgzfvl7kckltq",
            "n332atces042rns99qz6d437",
            "c3bfabqcysl1e6omgjxk058c",
        ],
        notifs: [
            "lnnnuqaljuwalmhkfosmkxcn",
            "z2bx08wywn03bqaqqgk6tmmo",
            "we15ti2ym3zye3pzfrkr3zm2",
            "e0kt7ugtcrgld8oh6h9fn2kd",
            "e8uzruzln6eh3dk04kmmsv5m",
        ],
        solver: [
            "amq5lbxpfhj15c43uyvo9lgj",
            "lzrey3w4un8bz1tpnjjmwri7",
            "qf6mjsdv2odcdzt1i0kvursp",
            "zeddpmgahjt9sgdwollcunfs",
            "tpvqcto5u4c31kmk8o4vcqb7",
            "sfn9hzxhmdcblsxkunqx972j",
            "mewy2oxtuya1trahe2eq2lmt",
            "jlkfb76ktwc8z02qfo8a7gta",
            "y3z3mbmlvqpj3izqisa8lmco",
            "auvos96co1wsksbhlixehz44",
        ],
        assistant: [
            "ibnkqrhjyn4jl9azkma1yl77",
            "rc7bra0bieifgx1wk6kqd4jw",
            "h8eesecg9tsa1855pd87ifht",
            "b5bgyy6ehjzl9sicl4vpqs1q",
        ],
        rh: ["l0bv4qzovsb6mfs42wu3t6xw", "bz0fz8t5jqv7aa9blp4830ta"],
    }

    # Mobile
    mobile_refonte = "exkapj2sbtqokyu301mjkdvh"
    mobile_pages = "cloga6elj376iakynz09gdbj"
    mobile_cap = "pdhbji4bfwiq81t5emhxnpap"
    label(mobile_refonte)
    label(mobile_pages)
    label(mobile_cap)
    groups[mobile_refonte] = [
        mobile_pages,
        "df44fo6u6n0qydtdiqj2lpln",
        "kcyta71ay9q21eciho1ntcz3",
    ]
    groups[mobile_pages] = [
        "vfdxs4afewhzo2oafobxxs8c",
        "mz5bykmbz991xrjawj97xfbf",
        "x6lyn3we9qpe3112xxxj33m1",
        "u4c8a0x81c1o13ca39e8lwva",
        "yjxim1ojuod6zhhyv2gjx79v",
        "gtss7a2gh03g0frgii0g2osb",
        "giucuoll2uggxw7qzfgps6q1",
        "w5u7dsjn72o1z2o78l5u3gvs",
        "k2vl3ovrmndm2cu3goy1m11e",
        "gnf5eh4wn67ivzj2mc15dh13",
        "kxmiudafdenn9lnvumlvx4w0",
    ]
    groups[mobile_cap] = [
        "q10tv4dju93cuaspi2zxjsae",
        "fxjmntthbxhn7otdq1zfyynp",
        "ix0yal6mkqiefpaz8h00oh08",
    ]

    # Business Cap décembre (nested)
    cap = "zwm7p937aqy947l819773431"
    vente = "rzxh6bumy8qq1okb6hmgujqh"
    marketing = "kaxvy3ywj6xq0717lorswpy5"
    onboard_biz = "kh59mfmncpho7iwqfxigr876"
    legal = "hphwi5i6kwprokytu42ng0f7"
    pilotage = "hsz87sqzzu1dd0ygov9uo74g"
    decisions = "xbb3auvx22ikusxpdse831l0"
    for epic_id in (cap, vente, marketing, onboard_biz, legal, pilotage, decisions):
        label(epic_id)
    groups[cap] = [vente, marketing, onboard_biz, legal, pilotage, decisions]
    groups[vente] = [
        "dx9aeom2gye1kjm2iskwaerz",
        "un973szhefr0c685wotiqriw",
        "ajha8k2nasorcyci3gn28mp2",
        "j9s0git4p2nviq30r0i2m2gp",
        "mko7ea6raqluwnthidkkq3jd",
        "wyvn9aohi8wlexl3wnyyn3p6",
        "v4ev38vb2etgztrh9ju5u5wx",
        "jexjcz96g7ucjaor17a9ndb0",
        "lfsqaegqy4svyyz9d1ngu7y7",
        "dygukkndo8zxww85vsffp067",
        "hu4yyci2ogcz5xxzw7vqxp0d",
    ]
    groups[marketing] = [
        "gnwv8iacshl01j16eonoom3a",
        "zhphh61231m11jtxvl00wfpz",
        "k67s5m0btq34i9hwwg20sn35",
        "n0o7ovp9kpliv1xxbre4uvr8",
        "u7ab6t2rgliytldjzkiun3l0",
        "yqtr1rv4zqph85ujkmn5lqwu",
        "kd49aijpvn0cnuc0k8ajc2wy",
        "e7vekux2t7dam3iteeswufuh",
        "w9un4s8z8u64kx4wz0dbx0pp",
        "xp0xerrmajj2hidmbm2pmh53",
    ]
    groups[onboard_biz] = [
        "pz6u1q3y0io3g32r71gw2ttz",
        "ne2p62lnq21w0ynxp2a914mu",
        "odbrrljjote04q4fo6gt34pl",
        "klmks0km1jhy06czfe1bx3ux",
        "ei0sn7659cu46ut5e1xfecke",
        "svtpe1qn8lf7r7bv6pizqt7c",
        "ve6h9xicldkfae3ep9lx5d2v",
        "atki31di1z27vbndkrlrs0n6",
    ]
    groups[legal] = [
        "m61q4uh4ritcnnk0bek80aq0",
        "ymi8pohanqlag39oyh36tv8r",
        "p1k7iut263naneludvoxbo1x",
        "yej249zcvjzulq1ltxloj0f1",
    ]
    groups[pilotage] = [
        "nyfsjp4h6m0ywuia365cjrdp",
        "cnz6eggxrveniqmx8e7t1f0m",
        "qs2khu1lx74eaj96joath2gx",
    ]
    groups[decisions] = [
        "obix4axcpoelmv7m28ktradg",
        "yx0bp5oeoty15ik858r67y0r",
        "u9xmr3funvhz9dxy0rxqiggu",
        "fvilu1g6n7fdnh7rllej3wui",
        "z1fy6pnbcv52m9lfkrq0tr8v",
    ]

    # Infra
    netcup = "q2zcw3fbyh7e0jrp7jrve0s9"
    selfhost = "kjposcb59d5fmsv7ri60zwmz"
    kaneo_epic = create_task(
        "y9l8utsa1d9q7i4izfwit2nn",
        "Épopée — Kaneo / Canéo (board SuperPagr)",
        "in-review",
        "Fork, UX board, MCP agents.",
    )
    label(netcup)
    label(selfhost)
    groups[netcup] = [
        "joxok2ibi4yc7bcarq97nw6x",
        "n88mj74wsj6av46n52i6e9r4",
        "x6ysqcu7jhlxo4hgbp2osa1q",
        "x4vg33nieoatuec75sypitdn",
        "auoif42qaiqepip13qqzdrik",
        "jt8budjaeyrhcz0qpy7vku7m",
        "z4j7sgbptouakgldguwuxqwp",
        "r5zddu6o3l1z7gb7uoda141k",
        "xqqg4dyh55sx7nh62fdpyxdh",
        "jaz816uxnw2ojv5t4g8pgu4n",
        "siw65fq5rp5ny9anjecmpfrt",
    ]
    groups[selfhost] = [
        "z8ofd4wf6ko9dmumz13bhbkq",
        "mrlyz3m22eess5vr9l6qiyys",
        "p3kp2yfcaxj0ohav2966mhx3",
        "aptu04cbevbwflh1iym9q4oo",
        "amk52a27nozikxdmn5yyup8d",
        "q6nncsnszhmvvleruy7b1zmp",
        "wdq8hzinxszyqe796vshdday",
        "oqid6d1uaf1bqz8bfvt5d2jq",
        "y9jaxsgfyr8ft3x58da8286d",
    ]
    groups[kaneo_epic] = [
        "q8bxjv9bjcl8hpswndcruf55",
        "t20ni3g224u73rs2v9lmuqs5",
    ]

    # Le Lien
    pipeline = "aa2336dtahtuquy3plh5jzv9"
    industrial = "dqwx4xvr319w5kwff2tt3ivo"
    ui_native = create_task(
        "y5hjl74tuldnorq8phorufls",
        "Épopée — UI native iOS / polish fiches",
        "in-review",
        "Liquid Glass, padding, tableaux, navigation, composants B.",
    )
    label(pipeline)
    label(industrial)
    groups[pipeline] = [industrial, ui_native]
    groups[ui_native] = [
        "yipdt07m5opjqlvnhe0q7otz",
        "zoa1urc5qzlinr776oe5tfsz",
        "kqs48sqaoe284b1cjpohk7e2",
        "gpms1odetk0w4rggu0jhxqgv",
        "k03foad9r84fsu9xmljsy9vl",
        "li2picpikfza3i8m8q92spdn",
        "b6en87ww5nj87czgfiv4bbav",
        "mz7z5wclobzocuspy7m6rjqx",
        "u9nghh6b40z31wwm86zqvf4t",
        "onxwow283s1p4cevucjkzigz",
        "id1k5gtmm0a5aqrc0w7kr35a",
        "wu3iwywrp6glzo9fxou4i6z1",
        "oojs5vk0bi3q2udbcda9h5xu",
        "istwes19q4q3mx89ua56h9wd",
        "reeq38izlqb5wy3aot5dml81",
        "m2qa7qzcyxc3zxektu7g2m8e",
        "stja6q8nff5vz0vw2vd59as5",
        "y1j1tko4pvqhgboe73uh00le",
        "f5oxnzd2yuec9pfk4l5gyi7w",
        "o0vy8y21jy4q1j2dkhq2phwe",
        "gygsxj1as64s87rv38ayfls8",
        "vp94cenz09y9rp71hqe1khha",
        "slqash80iedh67z0bb00l1oo",
    ]

    linked = 0
    skipped = 0
    for parent, children in groups.items():
        for child in children:
            result = req(
                "POST",
                "/task-relation",
                {
                    "sourceTaskId": parent,
                    "targetTaskId": child,
                    "relationType": "subtask",
                },
            )
            if result.get("already"):
                skipped += 1
            else:
                linked += 1
    print(json.dumps({"linked": linked, "skipped": skipped, "new_epics": {
        "admin": admin,
        "orgs": orgs,
        "auth": auth,
        "exchanges": exchanges,
        "publication": publication,
        "notifs": notifs,
        "solver": solver,
        "assistant": assistant,
        "kaneo": kaneo_epic,
        "lien_ui": ui_native,
    }}, indent=2))


if __name__ == "__main__":
    main()
