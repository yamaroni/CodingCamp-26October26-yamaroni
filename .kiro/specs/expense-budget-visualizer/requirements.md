# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web app that lets a user record spending transactions, review them in a scrollable list, see a running total balance, and view a pie chart of spending by category. It is built with HTML, CSS, and vanilla JavaScript, has no backend, and persists data in the browser Local Storage. It runs in modern browsers (Chrome, Firefox, Edge, Safari).

## Glossary

- **Visualizer**: The Expense & Budget Visualizer web application as a whole.
- **Input_Form**: The form containing the Item Name, Amount, and Category fields and a submit control.
- **Transaction**: A record consisting of a unique identifier, an item name, an amount, and a category.
- **Category**: One of the fixed values Food, Transport, or Fun.
- **Transaction_List**: The scrollable UI region that displays all Transactions.
- **Total_Balance**: The sum of the amounts of all Transactions, displayed at the top of the page.
- **Spending_Chart**: A pie chart showing the share of total spending per Category.
- **Storage**: The browser Local Storage API used to persist Transactions.
- **Chart_Library**: A simple third-party charting library (for example Chart.js) used to render the Spending_Chart.

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to enter an item name, amount, and category in a form, so that I can record my spending.

#### Acceptance Criteria

1. THE Input_Form SHALL provide an Item Name text field accepting a maximum of 100 characters, an Amount numeric field, and a Category selector offering exactly the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with an Item Name of 1 to 100 characters containing at least one non-whitespace character, an Amount greater than 0 and not greater than 999,999,999.99 with at most 2 decimal places, and a Category selected, THE Visualizer SHALL add a new Transaction containing the entered Item Name, Amount, and Category to the Transaction_List within 500 milliseconds.
3. WHEN a Transaction is added, THE Input_Form SHALL clear the Item Name and Amount fields, reset the Category selector to its initial unselected state, and remove any displayed error messages.
4. IF the user submits the Input_Form with the Item Name empty or containing only whitespace, THEN THE Input_Form SHALL display an error message identifying the Item Name field, SHALL NOT add a Transaction, and SHALL retain the values entered in the other fields.
5. IF the user submits the Input_Form with the Amount empty or non-numeric, THEN THE Input_Form SHALL display an error message identifying the Amount field, SHALL NOT add a Transaction, and SHALL retain the values entered in the other fields.
6. IF the user submits the Input_Form with no Category selected, THEN THE Input_Form SHALL display an error message identifying the Category field, SHALL NOT add a Transaction, and SHALL retain the values entered in the other fields.
7. IF the user submits the Input_Form with an Amount less than or equal to 0, THEN THE Input_Form SHALL display an error message stating that the Amount must be greater than zero, SHALL NOT add a Transaction, and SHALL retain the values entered in the other fields.
8. IF the user submits the Input_Form with an Amount greater than 999,999,999.99 or with more than 2 decimal places, THEN THE Input_Form SHALL display an error message identifying the Amount field and the permitted range and precision, SHALL NOT add a Transaction, and SHALL retain the values entered in the other fields.
9. IF the user submits the Input_Form with more than one invalid field, THEN THE Input_Form SHALL display an error message for each invalid field simultaneously and SHALL NOT add a Transaction.

### Requirement 2: Display the Transaction List

**User Story:** As a user, I want to see all my transactions in a list, so that I can review what I have spent.

#### Acceptance Criteria

1. THE Transaction_List SHALL display, for each Transaction, the item name, the amount, and the Category.
2. WHEN the Transactions exceed the visible height of the list region, THE Transaction_List SHALL provide vertical scrolling so that every Transaction, up to 1,000 Transactions, is reachable without the page itself scrolling.
3. WHEN a Transaction is added, THE Transaction_List SHALL show the new Transaction as the first entry in the list within 500 milliseconds and without a page reload.
4. WHILE no Transactions exist, THE Transaction_List SHALL display an empty-state message indicating that no Transactions have been recorded.
5. THE Transaction_List SHALL format each amount as currency with a currency symbol, a thousands separator, and exactly two decimal places (for example, 1,234.50).
6. IF an item name exceeds the width of its list entry, THEN THE Transaction_List SHALL wrap the item name onto additional lines within the entry without truncating any characters or overlapping the amount or the Category.
7. WHEN the first Transaction is added while the empty-state message is displayed, THE Transaction_List SHALL remove the empty-state message within 500 milliseconds.

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to delete a transaction, so that I can correct mistakes or remove outdated entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL display exactly one delete control for each Transaction, and each delete control SHALL be operable by mouse click, touch tap, and keyboard (Enter or Space key while focused).
2. WHEN the user activates the delete control of a Transaction, THE Visualizer SHALL remove that Transaction from the Transaction_List within 500 milliseconds.
3. WHEN the user activates the delete control of a Transaction, THE Visualizer SHALL leave all other Transactions unchanged in content (name, amount, category) and in relative order.
4. WHEN the user activates the delete control of a Transaction, THE Visualizer SHALL remove that Transaction from persistent storage so that the Transaction does not reappear after the page is reloaded.
5. WHEN a Transaction is deleted, THE Visualizer SHALL update the displayed total balance and the chart to exclude the deleted Transaction's amount within 500 milliseconds.

### Requirement 4: Show the Total Balance

**User Story:** As a user, I want to see my total spending at the top of the page, so that I know how much I have spent overall.

#### Acceptance Criteria

1. THE Visualizer SHALL display the Total_Balance above all other page content (including the Transaction list and chart) at all scroll positions of the initial page load.
2. THE Visualizer SHALL calculate the Total_Balance as the sum of the amounts of all Transactions, rounded to 2 decimal places.
3. THE Visualizer SHALL display the Total_Balance with exactly 2 decimal places, with a thousands separator, and a currency symbol or label, for values from 0.00 to 999,999,999.99.
4. WHEN a Transaction is added, THE Visualizer SHALL update the displayed Total_Balance within 100 ms of the Transaction appearing in the Transaction list.
5. WHEN a Transaction is deleted, THE Visualizer SHALL update the displayed Total_Balance within 100 ms of the Transaction being removed from the Transaction list.
6. WHILE no Transactions exist, THE Visualizer SHALL display a Total_Balance of 0.00.
7. WHEN the page is loaded or reloaded and stored Transactions exist, THE Visualizer SHALL display a Total_Balance equal to the sum of the stored Transaction amounts within 500 ms of page load completion.
8. IF the sum of all Transaction amounts exceeds 999,999,999.99, THEN THE Visualizer SHALL display an indication that the maximum displayable Total_Balance has been exceeded, and SHALL preserve all Transactions unchanged.

### Requirement 5: Visualize Spending by Category

**User Story:** As a user, I want a pie chart of my spending by category, so that I can see where my money goes.

#### Acceptance Criteria

1. THE Visualizer SHALL render a Spending_Chart as a pie chart using the Chart_Library.
2. THE Spending_Chart SHALL represent each Category that has at least one Transaction with a distinct color and a legend label showing the Category name.
3. THE Spending_Chart SHALL size each slice in proportion to the sum of Transaction amounts in that Category, such that each slice's share of the full circle equals the Category sum divided by the sum of all Transaction amounts.
4. THE Spending_Chart SHALL omit any Category whose Transaction amount sum is 0 or that has no Transactions.
5. WHEN a Transaction is added, THE Spending_Chart SHALL update to reflect the new Category sums within 100 ms.
6. WHEN a Transaction is deleted, THE Spending_Chart SHALL update to reflect the new Category sums within 100 ms.
7. WHILE no Transactions exist, THE Visualizer SHALL display a placeholder message indicating that no spending data is available in place of the Spending_Chart.
8. IF the Chart_Library fails to load or fails to render the Spending_Chart, THEN THE Visualizer SHALL display a message indicating that the chart is unavailable and SHALL leave all Transaction data unchanged.

### Requirement 6: Persist Data Locally

**User Story:** As a user, I want my transactions saved in my browser, so that they remain after I close or reload the page.

#### Acceptance Criteria

1. WHEN a Transaction is added or deleted, THE Visualizer SHALL write the updated set of Transactions to Storage within 100 milliseconds.
2. WHEN the page loads, THE Visualizer SHALL read Transactions from Storage and render the Transaction_List, Total_Balance, and Spending_Chart within 1 second.
3. IF Storage contains data that cannot be parsed as a list of Transactions, THEN THE Visualizer SHALL start with an empty list of Transactions, render an empty Transaction_List, a Total_Balance of 0, and an empty Spending_Chart, and display a message indicating that saved data could not be loaded.
4. IF writing to Storage fails (for example, because Storage is full or unavailable), THEN THE Visualizer SHALL keep the Transaction change in the current page view and display a message indicating that the data was not saved.
5. IF Storage contains no saved Transactions when the page loads, THEN THE Visualizer SHALL render an empty Transaction_List, a Total_Balance of 0, and an empty Spending_Chart without displaying an error message.
6. THE Visualizer SHALL store and process all data in the browser without sending data to any server.
7. FOR ALL valid lists of Transactions, serializing to Storage and then loading from Storage SHALL produce a list with the same number of Transactions, in the same order, with identical field values for each Transaction (round-trip property).

### Requirement 7: Project Structure and Technology

**User Story:** As a developer, I want a simple, framework-free project layout, so that the code is easy to read and run without setup.

#### Acceptance Criteria

1. THE Visualizer SHALL be implemented using HTML for structure, CSS for styling, and vanilla JavaScript, with no front-end framework (such as React or Vue) and no npm or build dependencies, and with the Chart_Library, loaded through a script tag from a CDN or a local file, as the only permitted third-party script.
2. THE Visualizer SHALL contain exactly one CSS file located in the css/ folder and exactly one HTML file at the project root, and the HTML file SHALL reference that CSS file through a single stylesheet link.
3. THE Visualizer SHALL contain exactly one JavaScript file located in the js/ folder, and the HTML file SHALL reference that JavaScript file through a single application script tag.
4. WHEN a user opens the HTML file in a browser using a file:// URL, THE Visualizer SHALL render its initial view and accept user interaction within 2 seconds, with no build step, backend server, package installation, or test setup required.
5. WHEN the HTML file is opened in the latest stable release or the immediately preceding major release of Chrome, Firefox, Edge, or Safari, THE Visualizer SHALL provide the same functionality as in the other listed browsers, with zero uncaught JavaScript errors reported in the browser console during load.
6. IF the browser has JavaScript disabled, THEN THE Visualizer SHALL display a visible message indicating that JavaScript is required.

### Requirement 8: Usability, Performance, and Visual Design

**User Story:** As a user, I want a clean and responsive interface, so that tracking expenses is quick and pleasant.

#### Acceptance Criteria

1. THE Visualizer SHALL present the Total_Balance, Input_Form, Transaction_List, and Spending_Chart on a single page, with the Total_Balance rendered in a font size at least 1.5 times the body font size and positioned above the Input_Form, Transaction_List, and Spending_Chart.
2. WHEN the user opens the Visualizer page on a connection of at least 10 Mbps with an empty browser cache, THE Visualizer SHALL display the Total_Balance, Input_Form, Transaction_List, and Spending_Chart and accept user input within 2 seconds.
3. WHEN the user adds or deletes a Transaction, THE Visualizer SHALL update the Total_Balance, Transaction_List, and Spending_Chart within 100 ms for a stored collection of up to 500 Transactions.
4. THE Visualizer SHALL use a body font size of at least 16 px and a contrast ratio of at least 4.5:1 between all text and its background.
5. THE Visualizer SHALL display a visible text label adjacent to each Input_Form field, and the label SHALL remain visible while the field contains a value.
6. WHILE the viewport width is between 360 px and 1920 px inclusive, THE Visualizer SHALL lay out all content without horizontal scrolling.
7. IF the viewport width is less than 360 px, THEN THE Visualizer SHALL keep the Input_Form, Transaction_List, and Total_Balance operable, with horizontal scrolling permitted.
