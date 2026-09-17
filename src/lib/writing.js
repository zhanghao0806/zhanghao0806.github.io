export const PAGE_SIZE = 5;

export const CATEGORIES = [
  {
    key: 'experiment',
    title: '做过的项目',
  },
  {
    key: 'note',
    title: '一些笔记',
  },
  {
    key: 'reflections',
    title: '杂思录',
  },
];

export const categoryLabels = Object.fromEntries(
  CATEGORIES.map((category) => [category.key, category.title]),
);

export const formatDate = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const sortPostsByDateDesc = (posts) =>
  posts.sort(
    (a, b) => new Date(b.frontmatter.date).valueOf() - new Date(a.frontmatter.date).valueOf(),
  );
