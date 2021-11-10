const cheerio = require('cheerio');

const _defaultHeaders = {
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
};

module.exports = {
	aspenSession: (domain) => {
		const _aspenDomain = domain; //Ex. "ma-maynard" (comes from the URL: https://ma-maynard.myfollett.com/)
		let _loggedIn = false;
		let _username;
		let _password;
		let _orgApacheStrutsTaglibHtmlTOKEN;
	
		let _request = require('request-promise');
		const _cookieJar = _request.jar();
		_request = _request.defaults({ jar: _cookieJar });
		
		function initialRequest() {
			return new Promise((resolve, reject) => {
				const options = { 
					method: 'GET', 
					uri: `https://${_aspenDomain}.myfollett.com/`,
					headers: _defaultHeaders,
					transform: (err, response) => { 
						_orgApacheStrutsTaglibHtmlTOKEN = cheerio.load(response.body)('[name$="logonForm"]').children("div").children("input").val() 
						_cookieJar.setCookie(response.headers['set-cookie'][0] + "; " + response.headers['set-cookie'][1]);
					},
				};
	
				_request(options)
					.catch(err => reject(err))
					.then(() => resolve());
			});
		}
	
		function loginRequest() {
			return new Promise((resolve, reject) => {
				const options = {
					method: 'POST',
					uri: `https://${_aspenDomain}.myfollett.com/aspen/logon.do`,
					followAllRedirects: true,
					headers: _defaultHeaders,
					form: {
						'org.apache.struts.taglib.html.TOKEN': _orgApacheStrutsTaglibHtmlTOKEN,
						"userEvent": "930",
						"deploymentId": `${_aspenDomain}`,
						"mobile": "false",
						"username": `${_username}`,
						"password": `${_password}`,
					},
					transform: (err, response) => {
						if (response.statusCode != "200") reject(response.statusCode);
						_loggedIn = true;
					},
				}
			
				_request(options)
					.catch(err => reject(err))
					.then(() => resolve());
			});
		}
		
		function getPortalClassPage() {
			return new Promise((resolve, reject) => {
				const options = {
					method: 'GET',
					uri: `https://${_aspenDomain}.myfollett.com/aspen/portalClassList.do?navkey=academics.classes.list`,
					headers: _defaultHeaders,
					transform: (err, response) => {
						if (response.statusCode != "200") reject(response.statusCode);
						return cheerio.load(response.body);
					},
				};
			
				_request(options)
					.catch(err => reject(err))
					.then($ => resolve($))
			});
		}
	
		function getRecentActivityWidget() {
			return new Promise((resolve, reject) => {
				const options = {
					method: 'GET',
					uri: `https://${_aspenDomain}.myfollett.com/aspen/studentRecentActivityWidget.do?preferences=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3Cpreference-set%3E%0A%20%20%3Cpref%20id%3D%22dateRange%22%20type%3D%22int%22%3E4%3C%2Fpref%3E%0A%3C%2Fpreference-set%3E`,
					headers: _defaultHeaders,
				}
	
				_request(options)
					.catch(err => reject(err))
					.then(xml => {
						const $ = cheerio.load(xml, { xmlMode: true });
						const recentActivity = [];
						$('recent-activity').children().each((i, ele) => recentActivity.push({ type: ele['name'], attribs: ele['attribs'] }));
						resolve(recentActivity)
					})
			});
		}
			
		function initializeAssignmentsPage(classToken, userEvent = '2100', selected = '0') {
			return new Promise((resolve, reject) => {
				getPortalClassPage()
					.catch(err => reject(err))
					.then($ => {
						const options = {
							method: 'POST',
							uri: `https://${_aspenDomain}.myfollett.com/aspen/portalClassList.do`,
							followAllRedirects: true,
							headers: {
								..._defaultHeaders,
								'Content-Type': 'application/x-www-form-urlencoded',
							},
				
							form: {
								'org.apache.struts.taglib.html.TOKEN': $('[name$="org.apache.struts.taglib.html.TOKEN"]').val(), //Don't ask me why it isn't just _orgApacheStrutsTaglibHtmlTOKEN! Aspen just changes the token for some reason idek.
								'userEvent': userEvent,
								'userParam': classToken,
								'operationId': '',
								'deploymentId': _aspenDomain,
								'scrollX': '0',
								'scrollY': '0',
								'formFocusField': '',
								'formContents': '',
								'formContentsDirty': '',
								'maximized': 'false',
								'menuBarFindInputBox': '',
								'selectedStudentOid': $('[name$="selectedStudentOid"]').val().replaceAll(' ', "+"),
								'jumpToSearch': '',
								'initialSearch': '',
								'yearFilter': 'current',
								'termFilter': 'current',
								'allowMultipleSelection': 'true',
								'scrollDirection': '',
								"fieldSetName": $('[name$="fieldSetName"]').val().replaceAll(' ', "+"),
								"fieldSetOid": $('[name$="fieldSetOid"]').val().replaceAll(' ', "+"),
								"filterDefinitionId": $('[name$="filterDefinitionId"]').val().replaceAll(' ', "+"),
								"basedOnFilterDefinitionId": $('[name$="basedOnFilterDefinitionId"]').val().replaceAll(' ', "+"),
								"filterDefinitionName": $('[name$="filterDefinitionName"]').val().replaceAll(' ', "+"),
								"sortDefinitionId": $('[name$="sortDefinitionId"]').val().replaceAll(' ', "+"),
								"sortDefinitionName": $('[name$="sortDefinitionName"]').val().replaceAll(' ', "+"),
								'editColumn': '',
								'editEnabled': 'false',
								'runningSelection': '',
								'bottomPageSelected': selected,
								'topPageSelected': selected,
							},
			
							transform: (err, response) => {
								if (response.statusCode == "500") reject(new Error("well fuck: " + response.statusCode));
								return cheerio.load(response.body);
							},
						};
				
						_request(options)
							.catch(err => reject(err))
							.then(() => resolve());
					});
			});
		}
			
		return {
			login: (user, pass) => {
				_username = user;
				_password = pass;
					
				return new Promise((resolve, reject) => {
					initialRequest()
						.catch(err => reject(err))
						.then(() => loginRequest())
						.then(() => resolve());
				});
			},
				
			getExternalWidgetHTML: () => {
				return new Promise((resolve, reject) => {
					if (!_loggedIn) { 
						reject("Not logged in!");
						return;
					}

					const options = {
						method: 'GET',
						uri: `https://${_aspenDomain}.myfollett.com/aspen/studentRecentActivityWidget.do?preferences=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3Cpreference-set%3E%0A%20%20%3Cpref%20id%3D%22dateRange%22%20type%3D%22int%22%3E4%3C%2Fpref%3E%0A%3C%2Fpreference-set%3E`,
						headers: _defaultHeaders,
						transform: (err, response) => {
							if (response.statusCode != "200") reject(response.statusCode);
							return cheerio.load(response.body);
						},
					}
						
					_request(options)
						.catch(err => reject(err))
						.then($ => resolve($))
				});
			},
			
			getPortalClassList: () => {
				return new Promise((resolve, reject) => {
					if (!_loggedIn) { 
						reject("Not logged in!");
						return;
					}
					
					getPortalClassPage()
						.catch(err => reject(err))
						.then($ => {
							$('#dataGrid').find('tr').eq(0).remove();
							const tableRows = $('#dataGrid').find('tr');
								const parsedTable = [];
								
								for (let i = 0; i < tableRows.length; i++) {
									const element = tableRows.eq(i);
									const className = element.find('td').eq(1).children('a').text();
									if (!className.includes('RBlock') && !className.includes('Advisory')) {
										parsedTable.push({
											class: className,
											classToken: element.find('td').eq(0).children('input').attr('id'),
											teacherName: element.find('td').eq(6).text().replaceAll('\n', ''),
											grade: element.find('td').eq(7).text().replaceAll('\n', ''),
										});
									}
								}
								
								resolve(parsedTable);
						})
				});
			},
			
			getAllRecentActivity: () => {
				return new Promise((resolve, reject) => {
					if (!_loggedIn) { 
						reject("Not logged in!");
						return;
					}

					getRecentActivityWidget()
						.catch(err => reject(err))
						.then(recentActivity => resolve(recentActivity))
				});
			},
			
			getRecentGradedAssignments: () => {
				return new Promise((resolve, reject) => {
					if (!_loggedIn) { 
						reject("Not logged in!");
						return;
					}

					getRecentActivityWidget()
						.catch(err => reject(err))
						.then(recentActivity => recentActivity.filter(e => e.type == "gradebookScore"))
						.then(recentGrades => resolve(recentGrades))
				});
			},
			
			getAllAssignmentsByClassToken: (classToken) => {
				return new Promise((resolve, reject) => {
					if (!_loggedIn) { 
						reject("Not logged in!");
						return;
					}

					const assignments = [];
					let topAssignmentFromPreviousPage = "";
	
					//recursive function that just keeps getting next assignment page until there aren't any more
					function getPage(i) {
						initializeAssignmentsPage(classToken, (i == 0) ? '2100' : '10', i)
							.catch(err => resolve(err))
							.then(() => {
								const options = {
									method: 'GET',
									uri: `https://${_aspenDomain}.myfollett.com/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd`,
									headers: _defaultHeaders,
									transform: (err, response) => {
										if (response.statusCode != "200") reject(response.statusCode);
										return cheerio.load(response.body);
									},
								};
								
								_request(options)
									.catch(err => reject(err))
									.then($ => {
										if ($('#dataGrid').find('tr').eq(1) && $('#dataGrid').find('tr').eq(1).html() != topAssignmentFromPreviousPage) {
											topAssignmentFromPreviousPage = $('#dataGrid').find('tr').eq(1).html();
	
											$('#dataGrid').find('tr').eq(0).remove();
											const tableRows = $('#dataGrid').find('tr');
	
											for (let index = 0; index < tableRows.length; index += 2) {
												const element = tableRows.eq(index);
												assignments.push({
													assignmentName: element.find('td').eq(1).text().replaceAll('\n', ''),
													grade: element.find('td').eq(4).find('span').eq(0).text().replaceAll('\n', ''),
													score: element.find('td').eq(4).find('td').eq(2).text().replaceAll('\n', '').replaceAll('(', '').replaceAll(')', ''),
													points: element.find('td').eq(4).find('td').eq(1).text().replaceAll('\n', '').split(" / ")[1] || '',
												});
											}
												
											getPage(++i);
	
										} else resolve(assignments);
									})
							});
					} getPage(0);
	
				});
			},
		}
	}
} 