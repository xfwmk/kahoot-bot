// ==UserScript==
// @name         kahoot-bots
// @namespace    https://github.com/xfwmk/smartrevise-bots/
// @version      1
// @description  Kahoot autosolver
// @match        kahoot.it/*
// @connect      api.groq.com
// @copyright    xfwmk - opel - kian
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // paste groq api key below

    const GROQ_API_KEY = 'GROQ_API_KEY';

    const MODEL = 'openai/gpt-oss-20b';

    let running = false;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function askGroq(question, answers) {
        return new Promise((resolve, reject) => {

            const numberedAnswers = answers
                .map((answer, index) => `${index}: ${answer}`)
                .join('\n');

            const prompt = `
You are answering a multiple-choice question.

Question:
${question}

Possible answers:
${numberedAnswers}

Determine the correct answer.

IMPORTANT:
Reply with ONLY the number of the correct answer.
For example, if the second answer is correct, reply:
1

Do not explain your answer.
Do not write anything except the number.
`;

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://api.groq.com/openai/v1/chat/completions',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },

                data: JSON.stringify({
                    model: MODEL,

                    messages: [
                        {
                            role: 'system',
                            content: 'You answer multiple-choice questions. Output only the answer number.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],

                    temperature: 0
                }),

                onload: function (response) {

                    if (response.status < 200 || response.status >= 300) {
                        reject(
                            new Error(
                                `Groq HTTP ${response.status}: ${response.responseText}`
                            )
                        );
                        return;
                    }

                    try {
                        const data = JSON.parse(response.responseText);

                        const text =
                            data?.choices?.[0]?.message?.content?.trim();

                        if (!text) {
                            reject(new Error('Groq returned an empty answer.'));
                            return;
                        }

                        const match = text.match(/\d+/);

                        if (!match) {
                            reject(
                                new Error(
                                    `Groq did not return an answer number: ${text}`
                                )
                            );
                            return;
                        }

                        resolve(Number(match[0]));

                    } catch (error) {
                        reject(error);
                    }
                },

                onerror: function () {
                    reject(new Error('Could not connect to Groq.'));
                }
            });
        });
    }
    
    function getQuestion() {

        const questionElement =
            document.querySelector('#questiontext');

        if (!questionElement) {
            return null;
        }

        const question =
            questionElement.innerText.trim();

        const answerElements = [
            ...document.querySelectorAll(
                '#answercontainer .col-12.mb-1'
            )
        ];

        const answers = answerElements
            .map(element => {

                const button =
                    element.querySelector('.js_answerButton');

                if (!button) {
                    return null;
                }

                return {
                    text: element.innerText.trim(),
                    element: element
                };
            })
            .filter(Boolean);

        if (!question || realAnswers.length === 0) {
            return null;
        }

        return {
            question,
            answers: realAnswers
        };
    }
