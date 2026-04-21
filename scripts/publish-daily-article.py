#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = ROOT / 'articles'
INDEX_PATH = ARTICLES_DIR / 'index.json'
SITE_URL = 'https://diego-devs.github.io/estoicismo-diario/'

SCHEDULE = {
    '2026-04-21': {
        'month': 4,
        'day': 21,
        'title': 'No Le Entregues Tu Paz a la Reacción',
        'originalTitle': "Don't Hand Your Peace Over to Reaction",
        'author': 'Epicteto',
        'quote': 'No son las cosas las que perturban a las personas, sino los juicios que hacen sobre ellas.',
        'quoteTranslation': 'It is not things that disturb us, but our judgments about them.',
        'source': 'Epicteto, Enquiridión, 5',
        'reflection': 'Gran parte del sufrimiento cotidiano no viene directamente de lo que sucede, sino de la velocidad con la que interpretamos lo sucedido. Algo sale distinto a lo esperado y enseguida lo llamamos desastre. Alguien responde con frialdad y lo convertimos en desprecio. Una demora se vuelve una ofensa. Un contratiempo pequeño se transforma, por obra de nuestra mente apresurada, en una historia completa de injusticia, fracaso o amenaza.\n\nEpicteto insistía en separar el hecho del juicio. El hecho suele ser más simple de lo que nuestra reacción inicial sugiere. Lo demás lo añadimos nosotros: suposiciones, dramatización, orgullo herido, necesidad de control. Y luego padecemos como si esa construcción mental fuera la realidad misma.\n\nPracticar estoicismo no significa no sentir nada. Significa no entregarle inmediatamente el mando a la primera interpretación. Entre lo que pasa y lo que decidimos que significa hay un espacio. En ese espacio vive la libertad interior.\n\nHoy conviene vigilar ese instante. Cuando algo te incomode, no corras a etiquetarlo. Di primero: esto es lo que ocurrió. Nada más. Después pregúntate si la lectura que estás haciendo es exacta, útil y justa. Muchas veces descubrirás que no estás sufriendo por el hecho, sino por la versión precipitada que fabricaste de él.\n\nLa paz no depende de que el mundo sea dócil. Depende, en buena medida, de que tu juicio no sea impulsivo.\n\nAhí está tu práctica de hoy: retrasar la reacción, limpiar la interpretación y responder con una mente menos invadida.',
        'tags': ['juicio', 'Epicteto', 'abril', 'reacción', 'paz interior', 'percepción', 'disciplina']
    }
}


def run(cmd, cwd=ROOT, capture_output=True):
    result = subprocess.run(cmd, cwd=cwd, text=True, capture_output=capture_output)
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return result.stdout.strip()



def load_index():
    return json.loads(INDEX_PATH.read_text(encoding='utf-8'))



def save_index(index_data):
    INDEX_PATH.write_text(json.dumps(index_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')



def ensure_article(date_str):
    if date_str not in SCHEDULE:
        raise KeyError(f'No hay contenido configurado para {date_str}')
    article_path = ARTICLES_DIR / f'{date_str}.json'
    article = {'date': date_str, **SCHEDULE[date_str]}
    if not article_path.exists():
        article_path.write_text(json.dumps(article, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return article_path, article



def ensure_index_entry(article):
    index_data = load_index()
    summary = {
        'date': article['date'],
        'month': article['month'],
        'day': article['day'],
        'title': article['title'],
        'author': article['author'],
        'tags': article['tags']
    }
    existing = next((item for item in index_data if item['date'] == article['date']), None)
    changed = False
    if existing:
        if existing != summary:
            existing.clear()
            existing.update(summary)
            changed = True
    else:
        index_data.append(summary)
        index_data.sort(key=lambda x: x['date'])
        changed = True
    if changed:
        save_index(index_data)
    return changed



def git_has_changes():
    result = subprocess.run(['git', 'status', '--porcelain'], cwd=ROOT, text=True, capture_output=True)
    return bool(result.stdout.strip())



def publish(date_str, push=True):
    article_path, article = ensure_article(date_str)
    index_changed = ensure_index_entry(article)

    created_or_updated = []
    if article_path.exists():
        created_or_updated.append(str(article_path.relative_to(ROOT)))
    if index_changed:
        created_or_updated.append(str(INDEX_PATH.relative_to(ROOT)))

    if not git_has_changes():
        return {
            'date': date_str,
            'title': article['title'],
            'author': article['author'],
            'site_url': SITE_URL,
            'changed_files': created_or_updated,
            'commit': None,
            'pushed': False,
            'status': 'already_published'
        }

    run(['git', 'add', str(article_path), str(INDEX_PATH)])
    run(['git', 'commit', '-m', f'feat: publicación diaria {date_str}'])
    commit = run(['git', 'rev-parse', 'HEAD'])
    if push:
        run(['git', 'push', 'origin', 'main'])

    return {
        'date': date_str,
        'title': article['title'],
        'author': article['author'],
        'site_url': SITE_URL,
        'changed_files': created_or_updated,
        'commit': commit,
        'pushed': push,
        'status': 'published'
    }



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', help='Fecha YYYY-MM-DD; por defecto hoy en UTC')
    parser.add_argument('--no-push', action='store_true')
    args = parser.parse_args()

    date_str = args.date or datetime.utcnow().strftime('%Y-%m-%d')
    result = publish(date_str, push=not args.no_push)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(json.dumps({'status': 'error', 'error': str(exc)}, ensure_ascii=False))
        sys.exit(1)
