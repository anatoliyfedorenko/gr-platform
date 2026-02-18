import { sleep } from './utils';
import { useStore } from '@/store/useStore';

export async function getInitiatives() {
  await sleep(400);
  return useStore.getState().initiatives;
}

export async function getInitiativeById(id: string) {
  await sleep(300);
  return useStore.getState().initiatives.find((i) => i.id === id) || null;
}

export async function getStakeholders() {
  await sleep(400);
  return useStore.getState().stakeholders;
}

export async function getStakeholderById(id: string) {
  await sleep(300);
  return useStore.getState().stakeholders.find((s) => s.id === id) || null;
}

export async function getDocuments() {
  await sleep(400);
  return useStore.getState().documents;
}

export async function getDocumentById(id: string) {
  await sleep(300);
  return useStore.getState().documents.find((d) => d.id === id) || null;
}

export async function getNotifications() {
  await sleep(300);
  return useStore.getState().notifications;
}

export async function getCompanies() {
  await sleep(200);
  const companies = await import('@/data/companies.json');
  return companies.default;
}

export async function getUsers() {
  await sleep(200);
  const users = await import('@/data/users.json');
  return users.default;
}
