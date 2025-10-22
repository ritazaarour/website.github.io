import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
console.log(projects);

const projectsContainer = document.querySelector('.projects');

renderProjects(projects[0], projectsContainer, 'h2');