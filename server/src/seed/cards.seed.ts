import { connectDatabase, disconnectDatabase } from "../config/database";
import { Card } from "../models/Card";
import { CardSeedData, cardsData } from "./cards.data";

const findCloseYears = (cards: CardSeedData[]): string[] => {
  const sorted = [...cards].sort((first, second) => first.year - second.year);
  const warnings: string[] = [];

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const distance = current.year - previous.year;

    if (distance < 2) {
      const relation = distance === 0 ? "trùng năm" : "cách nhau 1 năm";
      warnings.push(
        `${previous.cardId}. ${previous.event} (${previous.year}) và ` +
          `${current.cardId}. ${current.event} (${current.year}): ${relation}.`,
      );
    }
  }

  return warnings;
};

const validateCards = (cards: CardSeedData[]): void => {
  const ids = new Set(cards.map((card) => card.cardId));

  if (ids.size !== cards.length) {
    throw new Error("Dữ liệu seed có cardId bị trùng.");
  }

  for (const card of cards) {
    if (!Number.isInteger(card.cardId) || !Number.isInteger(card.year)) {
      throw new Error(`Thẻ ${card.cardId} có cardId hoặc year không hợp lệ.`);
    }
  }
};

const seedCards = async (): Promise<void> => {
  validateCards(cardsData);

  const warnings = findCloseYears(cardsData);
  if (warnings.length > 0) {
    console.warn("Cảnh báo các thẻ trùng năm hoặc cách nhau dưới 2 năm:");
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  } else {
    console.log("Không có thẻ nào trùng năm hoặc cách nhau dưới 2 năm.");
  }

  await connectDatabase();
  await Card.deleteMany({});
  await Card.insertMany(cardsData);
  console.log(`Đã seed ${cardsData.length} thẻ.`);
};

seedCards()
  .catch((error: unknown) => {
    console.error("Seed thất bại:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
