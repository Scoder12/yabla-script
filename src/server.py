import json
import aiosqlite
from fastapi import Depends, FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

import os
import csv
import io
from typing import Annotated, Union
from pathlib import Path

db_filename = os.environ["DB_FILENAME"]
auth_token = os.environ["AUTH_TOKEN"]
use_https = not os.environ.get("SERVER_IS_HTTP")
url_prefix = "https://" if use_https else "http://"
user_js_path = Path(__file__).parent / "flashcards.user.js"

con = None

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chinese.yabla.com"],
    allow_methods=["*"],
    allow_headers=["authorization"],
)


@app.on_event("startup")
async def startup():
    global con
    con = await aiosqlite.connect(db_filename)
    await con.execute("SELECT id, term, pinyin, definition FROM cards WHERE 0")


@app.get("/")
def index():
    return "flashcard creation backend 0.0.1"


@app.get("/flashcards.user.js")
def gen_user_js(auth_token: str, host: Annotated[Union[str, None], Header()]):
    with open(user_js_path, "r") as f:
        user_js = (
            f.read()
            .replace('"{{ API_URL }}"', json.dumps(url_prefix + host))
            .replace('"{{ AUTH_TOKEN }}"', json.dumps(auth_token))
        )
        return PlainTextResponse(user_js)


async def authed(authorization: Annotated[Union[str, None], Header()] = None):
    if authorization != auth_token:
        raise HTTPException(status_code=401, detail="Authorization header")


class CreateFlashcardParams(BaseModel):
    term: str
    pinyin: str
    definition: str


@app.put("/cards", dependencies=[Depends(authed)])
async def create(params: CreateFlashcardParams):
    await con.execute(
        """
            INSERT INTO 
                cards (term, pinyin, definition) 
            VALUES (?, ?, ?) 
            ON CONFLICT(term) DO UPDATE SET
                pinyin = excluded.pinyin,
                definition = excluded.definition
        """,
        (params.term, params.pinyin, params.definition),
    )
    await con.commit()
    return {"OK": True}


class CardDeleteParams(BaseModel):
    term: str


@app.delete("/cards", dependencies=[Depends(authed)])
async def delete(params: CardDeleteParams):
    await con.execute("DELETE FROM cards WHERE term = ?", (params.term,))
    await con.commit()
    return {"OK": True}


@app.get("/cards")
async def list_cards():
    async with con.execute("SELECT id, term, pinyin, definition FROM cards") as cur:
        return await cur.fetchall()


@app.get("/cards/csv")
async def gen_csv():
    out = io.StringIO()
    writer = csv.writer(out)
    async with con.execute("SELECT term, pinyin, definition FROM cards") as cur:
        async for row in cur:
            writer.writerow(row)
    return PlainTextResponse(out.getvalue())
