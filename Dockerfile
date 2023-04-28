FROM python:3.9.16-alpine3.17

    # python
ENV PYTHONUNBUFFERED=1 \
    # prevents python creating .pyc files
    PYTHONDONTWRITEBYTECODE=1 \
    \
    # pip
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    # do not ask any interactive question
    POETRY_NO_INTERACTION=1

RUN apk update && apk upgrade
RUN apk add --no-cache sqlite

# install poetry - respects $POETRY_VERSION & $POETRY_HOME
RUN pip install poetry

WORKDIR /app
COPY poetry.lock pyproject.toml .

RUN poetry config virtualenvs.create false \
  && poetry install --no-dev --no-interaction --no-ansi

COPY . .

ENTRYPOINT ["uvicorn", "src.server:app"]
