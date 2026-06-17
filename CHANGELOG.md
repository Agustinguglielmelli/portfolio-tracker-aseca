# [1.5.0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.4.0...v1.5.0) (2026-06-17)


### Bug Fixes

* add cache for search results to improve performance ([#65](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/issues/65)) ([7dcd84e](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/7dcd84ee3f438f73d0ed01945d8d08a9aebeab52))


### Features

* add watchlist and compare functionality with API integration ([8c05379](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/8c05379cd8b355cad153424d08aab9d41e1527fe))

# [1.4.0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.3.0...v1.4.0) (2026-06-17)


### Bug Fixes

* added missing watchlist module and fixed companies module ([82efcbb](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/82efcbb5ff6548ffa9216992efa014499ba095a7))
* fixed cypress tests and how tests are inicialized and added watchlist cypress test ([77ec92e](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/77ec92eb77e8bbe2c2ff0ea51d6c6691aa0db77a))
* forgot import ([7dc90f7](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/7dc90f7e69fd262db0ca1d07b82b61cdfe190154))


### Features

* add last update timestamp for price data in Dashboard and improve price checks in PricesTable ([fc7e2c0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/fc7e2c0c751422cd05aee7c69291109773cadaf5))
* add Locust load testing setup with auth and portfolio tasks ([0a6cd3f](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/0a6cd3f3eb4c28c5afaaeba9513a2eead92eee30))
* completed ticket [#45](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/issues/45), adding companies to watchlist ([cc33e2a](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/cc33e2a114328dfcfe0a99c719dec05eb16fe75f))
* completed ticket [#46](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/issues/46), added removal of companies from watchlist. Only backend with unit tests ([b6be977](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/b6be977c788ffdfc0c3e47b43d5f95df9c9b67f0))
* completed ticket [#47](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/issues/47), backend code with unit test ([9efdb7b](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/9efdb7bff2d1dda7ba361c777ff91a60d7283791))
* completed ticket [#49](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/issues/49), can now visualize watchlist, works correctly ([f2f8fc4](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/f2f8fc4d09f42b3aa962b48d0b9113ba417509e3))
* implement last update feature for price data in Dashboard with loading and error handling ([908699f](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/908699fedcd96045a8143cbe46802218ce666a17))
* **watchlist:** implmented frontend with connection with the backend of watchlist ([6a60363](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/6a60363c706d6e04a23625ef67cd910429d46050))

# [1.3.0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.2.0...v1.3.0) (2026-06-12)


### Features

* added signup and login mobile ([#57](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/issues/57)) ([5a10a78](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/5a10a786c4e48379cb80c428fb709c34ab188f16))

# [1.2.0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.1.1...v1.2.0) (2026-06-10)


### Features

* added buy, sell, get and delete portfolio endpoints ([2e8a643](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/2e8a6436ad066d85d82fcaa2d0ef0ab3ccd1b740))
* added fifo calculation for sales with its tests ([c25e7bd](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/c25e7bd3880a9d64d8db4ee4718cb9b1276f8088))
* added portfolio integration for web ([40ed2bb](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/40ed2bb712e6acca5531e14647e1cefea410ef8f))
* replaced PortfolioItem with the new Transaction ([92451af](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/92451af2727a492c2b50608e25ce040945e9f0c9))

## [1.1.1](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.1.0...v1.1.1) (2026-06-08)


### Bug Fixes

* fixed build error ([1b9cd45](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/1b9cd4551d39ef7d30647b7346dbf1d3ab100968))

# [1.1.0](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.0.1...v1.1.0) (2026-05-28)


### Features

* add PricesStatusBadge component to display price update status in Dashboard ([e2d384c](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/e2d384cb2877c78a434455d43be4ef21515eebf6))

## [1.0.1](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/compare/v1.0.0...v1.0.1) (2026-05-28)


### Bug Fixes

* admin login goes to /admin/dashboard ([751cf5e](https://github.com/Agustinguglielmelli/portfolio-tracker-aseca/commit/751cf5ec9fdf7f8cc3b35a29262e3e2200bd254b))

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
