-- CreateTable
CREATE TABLE "jugadores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "creado" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcceso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "juego" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'pts',
    "etiqueta" TEXT NOT NULL DEFAULT '',
    "menorEsMejor" BOOLEAN NOT NULL DEFAULT false,
    "creada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jugadorId" TEXT NOT NULL,
    CONSTRAINT "marcas_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "jugadores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "jugadores_usuario_key" ON "jugadores"("usuario");

-- CreateIndex
CREATE INDEX "marcas_juego_valor_idx" ON "marcas"("juego", "valor");

-- CreateIndex
CREATE INDEX "marcas_jugadorId_idx" ON "marcas"("jugadorId");
