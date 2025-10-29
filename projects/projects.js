import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const titleElement = document.querySelector('.projects-title');
titleElement.textContent = `${projects.length} Projects`;

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arc = arcGenerator({
  startAngle: 0,
  endAngle: (2 * Math.PI)  
});

d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');
//drawing static pie chart 
let data = [1, 2];

let total = 0;

for (let d of data) {
  total += d;
}
//start and end angles for each slice
let angle = 0;
let arcData = [];

for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

//path calculation for each slice  
let arcs = arcData.map((d) => arcGenerator(d));

arcs.forEach((arc) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill', 'red');
}
