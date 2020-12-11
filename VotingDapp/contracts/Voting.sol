// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Voting is Ownable {
    using SafeMath for uint;
    
    event VoterRegistered(address voterAddress);
    event ProposalsRegistrationStarted();
    event ProposalsRegistrationEnded();
    event ProposalRegistered(uint proposalId);
    event VotingSessionStarted();
    event VotingSessionEnded();
    event Voted (address voter, uint proposalId);
    event VotesTallied();
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    struct Voter {
      bool isRegistered;
      bool hasVoted;
      uint votedProposalId;
    }

    struct Proposal {
      string description;
      uint voteCount;
    }

    enum WorkflowStatus {
      RegisteringVoters,
      ProposalsRegistrationStarted,
      ProposalsRegistrationEnded,
      VotingSessionStarted,
      VotingSessionEnded,
      VotesTallied
    }

    mapping(address => Voter) public whitelist;
    uint public winningProposalId;
    Proposal[] public proposals;
    WorkflowStatus private current_status = WorkflowStatus.RegisteringVoters;
    
    function register_voter(address compte) public onlyOwner {
        require(current_status==WorkflowStatus.RegisteringVoters,"Ce n'est pas le bon moment !");
        require(whitelist[compte].isRegistered!=true,"Deja inscrit");       
        
        whitelist[compte] = Voter(true,false,0);    
        emit VoterRegistered(compte);
    }
    
    function start_proposals_registration() public onlyOwner {
        require(current_status==WorkflowStatus.RegisteringVoters,"Ce n'est pas le bon moment !");
        
        current_status = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters,WorkflowStatus.ProposalsRegistrationStarted);
        emit ProposalsRegistrationStarted();
    }
    
    // Je pars du principe qu'un utilisateur peut proposer autant de propositions qu'il le souhaite ?
    function register_proposal(string memory description) public
    {
        require(whitelist[msg.sender].isRegistered==true,"Utilisateur non enregistré");     
        require(current_status==WorkflowStatus.ProposalsRegistrationStarted,"Ce n'est pas le bon moment !");

        proposals.push( Proposal(description,0) );
        emit ProposalRegistered(proposals.length-1);
    }

    function end_proposals_registration() public onlyOwner {
        require(current_status==WorkflowStatus.ProposalsRegistrationStarted,"Ce n'est pas le bon moment !");
        
        current_status = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted,WorkflowStatus.ProposalsRegistrationEnded);
        emit ProposalsRegistrationEnded();
    }
    
    function start_voting_session() public onlyOwner {
        require(current_status==WorkflowStatus.ProposalsRegistrationEnded,"Ce n'est pas le bon moment !");
        
        current_status = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded,WorkflowStatus.VotingSessionStarted);
        emit VotingSessionStarted();
    }
    
    function send_vote(uint proposalId) public  {
        require(whitelist[msg.sender].isRegistered==true,"Utilisateur non enregistré");
        require(current_status==WorkflowStatus.VotingSessionStarted,"Ce n'est pas le bon moment !");
        require(whitelist[msg.sender].hasVoted==true,"Dejà voté");
        require(proposalId<proposals.length,"Proposition inconnue");
        
        proposals[proposalId].voteCount = proposals[proposalId].voteCount.add(1);
        
        whitelist[msg.sender].votedProposalId = proposalId;
        whitelist[msg.sender].hasVoted=true;
        
        emit Voted (msg.sender, proposalId);
    }
    
    function end_voting_session() public onlyOwner {
        require(current_status==WorkflowStatus.VotingSessionStarted,"Ce n'est pas le bon moment !");
        
        current_status = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted,WorkflowStatus.VotingSessionEnded);
        emit VotingSessionEnded();
    }
    
    function comptabiliser() public onlyOwner {
        require(current_status==WorkflowStatus.VotingSessionEnded,"Ce n'est pas le bon moment !");
        
        assert(proposals.length>0);
        
        // Cas non géré: ex aequo

        uint max;    // variable implicitement memory car locale ?
        max = proposals[0].voteCount;
        winningProposalId = 0;
                
        for (uint i=1;i<proposals.length;i++)
        {
            if (proposals[i].voteCount>max)
            {
                max = proposals[i].voteCount;
                winningProposalId = i;
            }
        }

        current_status = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded,WorkflowStatus.VotesTallied);
        emit VotesTallied();
    }
}
