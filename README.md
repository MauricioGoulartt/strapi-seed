# Strapi Faker Seed Plugin

Plugin personalizado para gerar seeds de dados fake de forma dinâmica e automatizada no Strapi v4, com suporte a relações e inferência inteligente de tipos.

## 🚀 Instalação

Clone ou mova este plugin para a pasta `./src/plugins/strapi-faker`.

```bash
mkdir -p ./src/plugins
cd ./src/plugins
git clone <repo-url-ou-path> strapi-faker
```

Ou copie o diretório manualmente para `src/plugins/strapi-faker`.

## 🧠 Como funciona

O plugin lê os atributos das coleções e gera dados fake coerentes com os tipos e nomes dos campos. Também preenche relações automaticamente quando possível.

- Usa o nome e tipo (`attrName`, `attr.type`) para sugerir dados
- Gera dados com base no `@faker-js/faker`
- Suporte a relacionamentos (muitos-para-um, um-para-muitos)
- Pode ser chamado via endpoint REST ou diretamente no `bootstrap`

## 🔧 Configuração

1. Registre o plugin no `./config/plugins.js`:

```js
module.exports = {
  'strapi-faker': {
    enabled: true,
    resolve: './src/plugins/strapi-faker'
  }
};
```

2. (Opcional) Configure permissões para o endpoint via `Users & Permissions`.

## ✅ Como usar

### Via HTTP

Endpoint:

```
POST /strapi-faker/seed
```

Body opcional:

```json
{
  "models": ["api::user.user", "api::article.article"],
  "count": 10
}
```

### Via código (bootstrap)

```js
await strapi.plugin('strapi-faker').service('myService').up();
```

## 🧼 Limpando dados (down)

```js
await strapi.plugin('strapi-faker').service('myService').down();
```

## 📁 Estrutura

- `controllers/my-controller.js` – expõe os endpoints
- `services/my-service.js` – lógica de seed e faker
- `content-types/` – vazio (não utiliza models próprios)
- `routes` – define `/seed` e `/clear`

## 📌 Notas

- Usa os schemas de cada collection do Strapi dinamicamente
- Suporta tipos nativos: `string`, `text`, `email`, `date`, `boolean`, `integer`, etc.
- Você pode estender o `matchers` para personalizar os dados por nome do campo

---
Desenvolvido para acelerar testes e desenvolvimento local com dados coerentes.
