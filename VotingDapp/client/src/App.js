import React, { Component } from "react";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
    state = { 
        web3: null, 
        accounts: null, 
        contract: null,
        
        // Champs UI
        input_address: null,
        input_description: null,

        // Variables d'état du contrat
        is_owner: null,
        current_status: null,
        winningProposalId: null,
        // whitelist: [],
        proposals_description: [],
        proposals_voteCount: []
    };

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = VotingContract.networks[networkId];
            const instance = new web3.eth.Contract(VotingContract.abi, deployedNetwork && deployedNetwork.address);

            // Question: existe t'il un event pour détecter le changement de compte dans metamask (en effet cela nécessite un refresh de la page)

            // Question: Faut il prévoir une gestion des ereurs dans les events ? En théorie c'est soit on reçoit l'évent, soit on le reçoit pas. Pas d'erreur possible ? Mais je vois des on("error") dans des codes d'exemple...
            // Question: Etrange: J'ai vu apparaitre certains events 9x, comme si chaque ligne ci dessous s'abonnait à tous les évènements. D'autres events ne sont déclenchés qu'une seule fois
            instance.events.VoterRegistered().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.ProposalsRegistrationStarted().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.ProposalsRegistrationEnded().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.ProposalRegistered().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.VotingSessionStarted().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.VotingSessionEnded().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.Voted().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.VotesTallied().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);
            instance.events.WorkflowStatusChange().on("data", (event) => this.on_contract_event(event)); // .on("error", console.error);

            this.setState({ web3, accounts, contract: instance }, this.refresh_contract_variables); 
        } 
        catch (error) {
            alert('Failed to load web3, accounts, or contract. Check console for details.');
            console.error(error);
        }
    };

    refresh_contract_variables = async () => {
        // Question A: De mémoire, dans l'IDE remix, je pouvais accéder aux variables d'état du contrat sans problème particulier, y compris pour les tableaux/mapping.
        // Nous sommes en effet sensé avoir un getter pour tous les champs publics.
        // Mais là, depuis web3js, impossible d'accéder aux tableaux. Erreur à l'exécution qui me réclame un paramètre supplémentaire.
        // Les structures de données (struct) ne semblent pas transmissibles également
        // Du coup solution de contournement avec la mise en place de get_proposals_length, get_proposal_description, get_proposal_voteCount
        // Un peu moche, y a t'il une meilleure solution ?
        // Par ailleurs, cela va augmenter de manière considérable le nombre d'appels !

        // Question B: Si on a des gros volumes dans le tableau, il faut gérer une "pagination" (ex: renvoie moi les 10 éléments à partir de l'index 20)
        // Rien n'a été prévu nativement dans web3js / solidity pour gérer ça ?

        // Même questions A et B pour les mappings

        var _proposals_description = [];
        var _proposals_voteCount = [];
        for (var i=0;i<await this.state.contract.methods.get_proposals_length().call();i++) {
            _proposals_description.push(await this.state.contract.methods.get_proposal_description(i).call());
            _proposals_voteCount.push(await this.state.contract.methods.get_proposal_voteCount(i).call());
        }

        // var _whitelist = await this.state.contract.methods.whitelist().call();
        // console.log(_whitelist);

        this.setState({
            is_owner: ((await this.state.contract.methods.owner().call()) === this.state.accounts[0])?'y':'n', // Question: pourquoi je suis obligé de mettre un triple =
            current_status: await this.state.contract.methods.current_status().call(),
            winningProposalId: await this.state.contract.methods.winningProposalId().call(),
            proposals_description: _proposals_description,
            proposals_voteCount: _proposals_voteCount,
            // whitelist: _whitelist
          });
    };

    on_contract_event = async (event) => {
        console.log(event.event);
        console.log(event.returnValues);
        await this.refresh_contract_variables();
    }

    // ADMIN
    on_btn_start_proposals_registration_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.start_proposals_registration().send({ from: accounts[0] });      
        }
        catch (error)
        {
             // Question: Quel est le moyen le plus propre de gérer les cas d'échec de la transaction ?
             // Et comment récupérer le texte que je met dans le require ?
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    on_btn_end_proposals_registration_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.end_proposals_registration().send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    on_btn_start_voting_session_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.start_voting_session().send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    on_btn_end_voting_session_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.end_voting_session().send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    on_btn_comptabiliser_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.comptabiliser().send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    on_btn_register_voter_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.register_voter(this.state.input_address).send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    // Votants:
    on_btn_register_proposal_click = async () => {
        const { accounts, contract } = this.state;
        try
        {
            await contract.methods.register_proposal(this.state.input_description).send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    on_btn_send_vote_click = async (index) => {
        const { accounts, contract } = this.state;
        try
        {
            console.log(index)
            await contract.methods.send_vote(index).send({ from: accounts[0] });
        }
        catch (error)
        {
            alert('Echec de la transaction.');
            console.error(error);
        }
    };

    // A FAIRE CI DESSOUS: Moyen de faire plus simple pour récupérer la valeur d'un champ texte:
    //  Voir ici: https://github.com/Alyra-school/whitelist-react-box/blob/master/client/src/App.js
    on_input_address_change = e => { this.setState( { input_address : e.target.value } ); };
    on_input_description_change = e => { this.setState( { input_description : e.target.value } ) };

    render() {
        if (!this.state.web3) {
            return <div>You need Metamask wallet.</div>;
        }
        return (
            <div className="App">
                {/* Admin */}
                <div>
                    <button onClick={this.on_btn_start_proposals_registration_click}>start_proposals_registration</button>
                    <button onClick={this.on_btn_end_proposals_registration_click}>end_proposals_registration</button>
                    <button onClick={this.on_btn_start_voting_session_click}>start_voting_session</button>
                    <button onClick={this.on_btn_end_voting_session_click}>end_voting_session</button>
                    <button onClick={this.on_btn_comptabiliser_click}>comptabiliser</button>

                    <br />

                    <input type="text" onChange={this.on_input_address_change} />
                    <button onClick={this.on_btn_register_voter_click}>register_voter</button>
                </div>

                {/* Votants */}
                <div>
                    <input type="text" onChange={this.on_input_description_change} />
                    <button onClick={this.on_btn_register_proposal_click}>register_proposal</button>
                </div>

                <div>is_owner : {this.state.is_owner}</div>
                <div>current_status : {this.state.current_status}</div>
                <div>winningProposalId : {this.state.winningProposalId}</div>

                <div>
                    { this.state.proposals_description.map((item, index) =>
                        <div key={index}>
                            <button onClick={ ()=>this.on_btn_send_vote_click(index) }>{item}</button>   {this.state.proposals_voteCount[index]}                          
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default App;
