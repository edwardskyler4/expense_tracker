# Bank-Connected Expense Tracker

An expense-tracking application that connects to a test bank account through Plaid's Sandbox environment, imports transaction history, categorizes transactions, and displays spending information in a simple dashboard.

This project is intended for learning full-stack development, API integration, authentication boundaries, database design, synchronization, and responsible use of AI coding tools. It uses sandbox data only and is not a production financial application.

## Instructions for Build and Use

### Prerequisites

* Node.js and npm
* A Plaid developer account with Sandbox credentials
* Plaid Sandbox test institution credentials

### Setup and Run

1. Clone the repository and install the frontend and backend dependencies.
2. Create environment-variable files for the backend Plaid credentials. Keep secrets out of source control.
3. Initialize the SQLite database and apply the initial schema.
4. Start the Node.js backend API.
5. Start the React frontend and open the local development URL.

### Using the Application

1. Use Plaid Link to connect a Plaid Sandbox test institution.
2. Complete the connection flow; the backend exchanges the temporary public token and stores the connection.
3. Synchronize transactions from the connected account.
4. Review imported transactions in the dashboard.
5. Assign or modify categories and filter transactions by category or date.

The frontend does not access Plaid's private transaction endpoints. Plaid credentials and access tokens remain on the backend.

## Development Environment

The planned development environment uses:

* React with TypeScript
* Node.js backend API
* Plaid Node/API client with Plaid Sandbox
* SQLite database
* Environment-variable handling for API credentials
* Automated testing tools

## Useful Websites to Learn More

* [Plaid Transactions and Webhooks Documentation](https://plaid.com/docs/transactions/webhooks/)
* [Plaid Link Documentation](https://plaid.com/docs/link/)
* [Plaid Sandbox Documentation](https://plaid.com/docs/sandbox/)
* [React Documentation](https://react.dev/)
* [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Architecture

~~~
React frontend
      |
Node.js backend API ---> Plaid Sandbox API
      |
SQLite database          Webhook or sync event
~~~

The core data model includes bank connections, accounts, and transactions. Each transaction stores a unique plaidTransactionId so repeated synchronization does not create duplicates.

## Planned Milestones

* [ ] Set up the React and Node.js projects, TypeScript, environment variables, and SQLite schema.
* [ ] Implement Plaid Link and secure public-token exchange.
* [ ] Synchronize, paginate, and de-duplicate transactions.
* [ ] Build the transaction dashboard with categorization and filters.
* [ ] Add loading, empty, and error states.
* [ ] Add automated tests and document setup limitations.

## Future Work

After the sandbox version is stable, possible improvements include:

* [ ] User authentication and support for multiple users or bank connections
* [ ] Plaid Production access and encrypted production token storage
* [ ] Webhook signature validation and automatic synchronization
* [ ] Bank reconnection, update mode, account deletion, and data export
* [ ] Advanced budgeting, recurring-payment detection, and additional account types
* [ ] Production monitoring, privacy policy, consent workflows, and security review

## Scope and Limitations

The initial version excludes real bank accounts, payments or money transfers, investment and credit-account tracking, mobile applications, public deployment, and production-grade compliance, privacy, and security review. It must not be treated as a production financial application.
