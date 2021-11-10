# Aspen-SIS
An npm package for scraping user data off of sites using Aspen SIS

Installation
-----
```
npm install aspen-sis
```
Requires
-----
  * request-promise
  * cheerio

Usage
-----

### Adding To Project
``` javascript
const { aspenSession } = require('aspen-sis');
const schoolAspenID = "ma-maynard" //Comes from: https://ma-maynard.myfollett.com/
const session = aspenSession(schoolAspenID);
```

### Logging In
``` javascript
const username = "";
const password = "";
session.login(username, password).then(() => {
  console.log("Logged In!");
});
```

### Getting PortalClassList Page
``` javascript
session.getPortalClassList().then(classList => {
  console.log(classList);
})
```
Output:
```
[
  {
    class: 'English',
    classToken: 'SSC128342982fw',
    teacherName: 'Bar, Foo',
    grade: '60.0'
  },
  {
    class: 'Math',
    classToken: 'SSC592857282fk',
    teacherName: 'Doe, John',
    grade: '90.0'
  },
  ...
]
```

### Getting All Recent Activity
``` javascript
session.getAllRecentActivity().then(recentActivity => {
  console.log(recentActivity);
});
```
Output:
```
[
  {
    type: 'gradebookScore',
    attribs: {
      assignmentoid: 'GCD039282381tn',
      date: '2021-09-30',
      gtmoid: 'GTM002938471xt',
      classname: 'Math',
      grade: '100.0',
      oid: 'GSC000000Cunt',
      assignmentname: 'Textbook Work',
      sscoid: 'SSC592857282fk'
    }
  },
  {
    type: 'gradePost',
    attribs: {
      date: '2021-11-08',
      classname: 'Math',
      teacherfirst: 'John',
      oid: 'GPS00000069lol',
      type: '1',
      teacherlast: 'Doe',
      sscoid: 'SSC592857282fk'
    }
  },
  ... //I can't show what attendence looks like because I haven't been absent recently
]
```

### Getting All Recently Graded Assignments
``` javascript
session.getRecentGradedAssignments().then(recentAssignments => {
  console.log(recentAssignments);
});
```
Output:
```
[
  {
    type: 'gradebookScore',
    attribs: {
      assignmentoid: 'GCD039282381tn',
      date: '2021-09-30',
      gtmoid: 'GTM002938471xt',
      classname: 'Math',
      grade: '100.0',
      oid: 'GSC000000A32hm',
      assignmentname: 'Textbook Work',
      sscoid: 'SSC592857282fk'
    }
  },
  {
    type: 'gradebookScore',
    attribs: {
      assignmentoid: 'GCD03928853ll',
      date: '2021-09-29',
      gtmoid: 'GTM002938471xt',
      classname: 'Math',
      grade: '0.0',
      oid: 'GSC000000A32hm',
      assignmentname: 'Other Textbook Work',
      sscoid: 'SSC592857282fk'
    }
  },
  ...
]
```

### Get All Assignments By Class (for the quarter/trimester)
``` javascript
session.getPortalClassList().then(classList => {
  const class = classList[0] //You can choose any class from classList array
  session.getAllAssignmentsByClassToken(class.classToken)
    .catch(err => console.log(err))
    .then(assignments => console.log(assignments))
})
```
Output:
```
[
  {
    assignmentName: 'Textbook Work', 
    grade: '90.0', 
    score: '4.5', 
    points: '5' 
  },
  {
    assignmentName: 'More Textbook Work', 
    grade: '100', 
    score: '10', 
    points: '10' 
  },
  {
    assignmentName: 'OMG Why Is There So Much Textbook Work!?!?!?', 
    grade: '20', 
    score: '1', 
    points: '5' 
  },
  ...
]
```
