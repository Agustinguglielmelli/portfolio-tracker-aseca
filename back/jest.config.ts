import type { Config } from 'jest';

const config: Config = {
    // Los proyectos separan entornos y rutas para que ambos funcionen
    projects: [
        {
            displayName: 'unit',
            moduleFileExtensions: ['js', 'json', 'ts'],
            rootDir: 'src',
            testRegex: '.*\\.spec\\.ts$',
            transform: {
                '^.+\\.(t|j)s$': 'ts-jest',
            },
            testEnvironment: 'node',
        },
        {
            displayName: 'e2e',
            moduleFileExtensions: ['js', 'json', 'ts'],
            rootDir: 'test',
            testRegex: '.*\\.e2e-spec\\.ts$',
            transform: {
                '^.+\\.(t|j)s$': 'ts-jest',
            },
            testEnvironment: 'node',
        },
    ],
};

export default config;