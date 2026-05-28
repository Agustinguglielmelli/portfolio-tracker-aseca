# 1.0.0 (2026-05-28)


### Bug Fixes

* add semantic-release config file ([49fed0c](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/49fed0cd3c8ca70b85e268d3e074c02945f1f9ce))
* cast lastLog.details to TickerDetail[] for type safety ([69e7131](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/69e71312bf092b13f989286f079aef8b7466e3ab))
* disable husky pre-commit on github actions CI ([01e8679](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/01e8679e0eb59e4c28ea3b23c5da8ae83fd6a759))
* prevent null company tickers by parsing them from the name since the JSON response doesn't include a ticker field ([eaa48cc](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/eaa48ccb26de9c834806df2a9149206b0dc0b769))
* refactor update_prices tests to use pandas DataFrame and improve mocking ([2255803](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/22558031abf1866b5643f33812af6043edf1c166))
* remove unnecessary closing div in Dashboard component ([3600773](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/3600773d2eb698e2a357eec1579cfeb61d8f9c11))
* update admin email in seed data for consistency ([5d9d958](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/5d9d9587e22ec05fbfa6981f7701ab8b1a51bdb3))


### Features

* add Prices module with controller and service for stock price updates, include Python script for batch processing ([398a6ab](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/398a6abf0e07848a4feedffecfb94d54a40028fd))
* add recharts and update dependencies in package-lock.json ([a362d01](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/a362d01060b550ef33224138c531eab90920ff1a))
* Edgar API added with all its endpoints ([f2165d7](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/f2165d7316574b071dd074b4fb7ee927aa8ff2e0))
* endpoint /portfolio and tests ([64392a0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/64392a006522d0ce0b4cb20f73ffa512d27e7ce6))
* enhance CompanyDetail component with improved type definitions and data handling ([17afae1](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/17afae15c0776f35db863182721216d451bcd6e0))
* implement admin dashboard with price update functionality and JWT authorization ([5930779](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/5930779b1b45e867aec040ffa0da6012f85ce60f))
* implement us 3.1 with changes, 3.2, 3.3, 3.4, 3.6 ([ad65a03](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/ad65a0373508c380b05de1b7aaf96bb4191c3955))
* integrate PostgreSQL adapter and update Prisma configuration ([be6689a](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/be6689a084be3cb0b54e058940ac3a9f0373c9bf))
* refactor API URL handling and enhance type definitions in components ([0d308cd](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/0d308cd8f9b9f963a297f9a8a36263f00883fe05))
* update .gitignore to exclude PDF files ([5889b7b](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/5889b7b0e7ed7e3e04a551c70a15e569f5b08798))
* update Docker configuration to include database seeding and enhance Prisma setup ([b817c76](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/b817c76fc14cf5c04ccb8da911e9a107c60178b5))
* update Dockerfile to include Prisma migration and seeding commands ([5daa9d3](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/5daa9d3ceeae404d08102d95ff3a30314ffb5f55))
* update Prisma configuration and TypeScript settings for improved structure ([415b055](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/415b055361343dc8fa7f9636d8f33a24c4b275ae))
* update TypeScript module settings to use node16 for compatibility ([2be33de](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/2be33de6dc92f2f082507a5e3130863a8835134b))
