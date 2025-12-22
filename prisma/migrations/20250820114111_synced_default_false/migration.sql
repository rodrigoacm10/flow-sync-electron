-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "name", "saved", "synced", "userId") SELECT "id", "name", "saved", "synced", "userId" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_Chip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Chip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chip" ("clientId", "date", "id", "saved", "synced", "userId", "value") SELECT "clientId", "date", "id", "saved", "synced", "userId", "value" FROM "Chip";
DROP TABLE "Chip";
ALTER TABLE "new_Chip" RENAME TO "Chip";
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "useChip" BOOLEAN NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Client_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("groupId", "id", "name", "saved", "synced", "useChip", "userId") SELECT "groupId", "id", "name", "saved", "synced", "useChip", "userId" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE TABLE "new_ClientChip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chipId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ClientChip_chipId_fkey" FOREIGN KEY ("chipId") REFERENCES "Chip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientChip_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClientChip" ("chipId", "clientId", "id", "saved", "synced") SELECT "chipId", "clientId", "id", "saved", "synced" FROM "ClientChip";
DROP TABLE "ClientChip";
ALTER TABLE "new_ClientChip" RENAME TO "ClientChip";
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("id", "name", "saved", "synced", "userId") SELECT "id", "name", "saved", "synced", "userId" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("clientId", "clientName", "date", "id", "saved", "synced", "userId") SELECT "clientId", "clientName", "date", "id", "saved", "synced", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_OrderProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "OrderProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderProduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderProduct" ("id", "orderId", "productId", "saved", "synced") SELECT "id", "orderId", "productId", "saved", "synced" FROM "OrderProduct";
DROP TABLE "OrderProduct";
ALTER TABLE "new_OrderProduct" RENAME TO "OrderProduct";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "useQuantity" BOOLEAN NOT NULL,
    "quantity" INTEGER,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "id", "name", "quantity", "saved", "synced", "useQuantity", "userId", "value") SELECT "categoryId", "id", "name", "quantity", "saved", "synced", "useQuantity", "userId", "value" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("id", "name", "password", "saved", "synced") SELECT "id", "name", "password", "saved", "synced" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
