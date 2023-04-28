import sqlite3
import sys


def main():
    _, db_filename = sys.argv
    con = sqlite3.connect(db_filename)
    con.execute(
        """
            CREATE TABLE cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                term STRING UNIQUE,
                pinyin STRING,
                definition STRING
            )
        """
    )
    con.commit()


if __name__ == "__main__":
    main()
