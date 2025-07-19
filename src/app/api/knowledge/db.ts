import fs from 'fs';
import path from 'path';
import { KnowledgeItem } from '@/lib/types';

const dataFilePath = path.join(process.cwd(), 'data', 'knowledge.json');

function readData(): KnowledgeItem[] {
  try {
    const jsonData = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    return [];
  }
}

function writeData(data: KnowledgeItem[]) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data to file:", error);
  }
}

export let knowledgeItems: KnowledgeItem[] = readData();

export function addItem(item: KnowledgeItem) {
    knowledgeItems.push(item);
    writeData(knowledgeItems);
}

export function deleteItem(id: string) {
    const itemIndex = knowledgeItems.findIndex((item) => item.id === id);
    if (itemIndex > -1) {
        knowledgeItems.splice(itemIndex, 1);
        writeData(knowledgeItems);
    }
}