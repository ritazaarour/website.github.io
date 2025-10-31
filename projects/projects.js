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
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));
let colors = d3.scaleOrdinal(d3.schemeSet3);
arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx));
});

//legend
let legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .attr('class', 'legend-item')
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});

//search bar
let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
  query = event.target.value;
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  renderProjects(filteredProjects, projectsContainer, 'h2');
});

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // --- clear up old paths & update slices (D3 join) ---
  // Ensure there's a group for slices inside your SVG; adjust selector as needed
  const svg = d3.select('#pie-svg'); // change selector to match your markup
  let slicesGroup = svg.selectAll('g.slices').data([null]);
  slicesGroup = slicesGroup.enter().append('g').attr('class', 'slices').merge(slicesGroup);

  // Join new data to path elements
  const paths = slicesGroup.selectAll('path.slice').data(newArcData, d => d.data.label);
  // Exit
  paths.exit().transition().duration(250).attr('opacity', 0).remove();
  // Enter + update
  paths.enter()
    .append('path')
    .attr('class', 'slice')
    .attr('fill', d => colorScale(d.data.label))
    .attr('d', d => arcGenerator(d))
    .attr('opacity', 0)
    .merge(paths)
    .transition()
    .duration(350)
    .attr('d', d => arcGenerator(d))
    .attr('fill', d => colorScale(d.data.label))
    .attr('opacity', 1);

  // --- update legend (simple text + color box example) ---
  const legendContainer = d3.select('#pie-legend'); // change to your legend container
  const legendItems = legendContainer.selectAll('.legend-item').data(newData, d => d.label);

  // Remove old legend items
  legendItems.exit().remove();

  // Add new legend items
  const enterItems = legendItems.enter()
    .append('div')
    .attr('class', 'legend-item')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('margin-bottom', '4px');

  enterItems.append('span')
    .attr('class', 'legend-swatch')
    .style('width', '12px')
    .style('height', '12px')
    .style('display', 'inline-block')
    .style('margin-right', '8px')
    .style('background-color', d => colorScale(d.label));

  enterItems.append('span')
    .attr('class', 'legend-label')
    .text(d => `${d.label} (${d.value})`);

  // Update existing legend text/swatch
  legendItems.select('.legend-swatch')
    .style('background-color', d => colorScale(d.label));
  legendItems.select('.legend-label')
    .text(d => `${d.label} (${d.value})`);
}

// Call this function on page load
renderPieChart(projects);

searchInput.addEventListener('change', (event) => {
  let filteredProjects = setQuery(event.target.value);
  // re-render legends and pie chart when event triggers
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

let newSVG = d3.select('svg');
newSVG.selectAll('path').remove();