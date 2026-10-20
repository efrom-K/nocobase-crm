#!/usr/bin/env python3
"""Сторис мессенджера: crm_stories (фото/видео или текст на фоне, живут 24 ч) и crm_story_views (кто смотрел).
Права — общие стратегии ролей (как у чатов). Интерфейс — src/messenger.js (лента над списком чатов). Повторный запуск безопасен.

    NB_URL=http://localhost:13000 NB_TOKEN=<токен root> python3 setup_stories.py
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('NB_URL', 'http://localhost:13000').rstrip('/')
TOKEN = os.environ.get('NB_TOKEN') or sys.exit('NB_TOKEN is required')

def call(path, body=None):
    req = urllib.request.Request(BASE + '/api/' + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'X-Authenticator': 'basic'},
                                 method='POST' if body is not None else 'GET')
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'body': e.read().decode()[:300]}

def ok(r): return 'ok' if 'data' in r else r.get('body', r)
def F(name, typ, iface, title, comp): return {'name': name, 'type': typ, 'interface': iface, 'uiSchema': {'type': 'string', 'title': title, 'x-component': comp}}
def I(name, title): return F(name, 'bigInt', 'integer', title, 'InputNumber')
def S(name, title): return F(name, 'string', 'input', title, 'Input')
def DT(name, title): return F(name, 'date', 'datetime', title, 'DatePicker')
def M2O(name, target, fk, title): return {'name': name, 'type': 'belongsTo', 'interface': 'm2o', 'target': target, 'foreignKey': fk, 'targetKey': 'id',
                                          'uiSchema': {'type': 'object', 'title': title, 'x-component': 'AssociationField'}}

have = {c['name'] for c in call('collections:list?paginate=false').get('data', [])}
if 'crm_stories' not in have:
    print('crm_stories', ok(call('collections:create', {'name': 'crm_stories', 'title': 'Сторис', 'autoGenId': True, 'createdAt': True, 'updatedAt': True, 'fields': [
        I('author_id', 'Автор'), M2O('author', 'users', 'author_id', 'Автор'),
        I('media_id', 'Файл'), M2O('media', 'attachments', 'media_id', 'Фото / видео'),
        F('text', 'text', 'textarea', 'Текст', 'Input.TextArea'), S('bg', 'Фон текста'), DT('expires_at', 'Видна до')]})))
if 'crm_story_views' not in have:
    print('crm_story_views', ok(call('collections:create', {'name': 'crm_story_views', 'title': 'Просмотры сторис', 'autoGenId': True, 'createdAt': True, 'updatedAt': False, 'fields': [
        I('story_id', 'Сторис'), I('viewer_id', 'Кто смотрел'), M2O('viewer', 'users', 'viewer_id', 'Кто смотрел')]})))
