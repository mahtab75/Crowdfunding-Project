import { Component, OnInit } from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import Web3 from 'web3';
import { Router } from '@angular/router';
import { DataService } from "../../data.service";



declare let require: any;
const project_artifacts = require('../../../../build/contracts/Project.json');
const crowdfunding_artifacts = require('../../../../build/contracts/Crowdfunding.json');
import {MatDialog} from '@angular/material/dialog';
import { InvestmentContractDialogComponent } from '../../investment-contract-dialog/investment-contract-dialog.component';
import { InvestmentDialogComponent } from '../../investment-dialog/investment-dialog.component';


@Component({
  selector: 'app-list-projects',
  templateUrl: './list-projects.component.html',
  styleUrls: ['./list-projects.component.css']
})
export class ListProjectsComponent implements OnInit {

  projectName=''
   projectDescription=''
   duration=0;
   goal=0;

   crowdData: any;
   accounts: string[];
   account: string;
   projectContractList = [];
   projectData = [];

   test = "ishala kar konam:))";

   projectContract:any;
  constructor(private data: DataService, private web3Service: Web3Service, private route: Router, public dialog: MatDialog) {

  }

  ngOnInit() {
    this.data.currentMessage.subscribe(message => this.test = message);

    this.watchAccount();
    this.web3Service.artifactsToContract(crowdfunding_artifacts)
    .then((CrowdfundingAbstraction) => {
     
      this.crowdData = CrowdfundingAbstraction;
      this.getProjects();
    });    
  }

  async getProjects() {
    let projectsList=[];
    var now = new Date().getTime();
    var timeleft;
    // Operations for retrieving all existing projects will be here!
    console.log('Get projects!');

    const deployedCrowdContract = await this.crowdData.deployed();

    //projectsList = deployedCrowdContract.returnAllProjects();

    //console.log('projectsList..:', projectsList);
    deployedCrowdContract.returnAllProjects().then((projects) => {
      
      

      this.web3Service.artifactsToContract(project_artifacts)
      .then((ProjectAbstraction) => {
        console.log('projects..:', projects.length);
        this.projectContractList = projects
        projects.forEach((projectAddress) => {
        ProjectAbstraction.at(projectAddress).then((data) => {
          console.log('data....:', data)
          data.getDetails()
          .then((res) => {
            console.log('res.requestValue.:', Web3.utils.fromWei(res.requestValue, 'ether'));
            console.log('res.approvalsCount.:', res.approvalsCount.toString()); 
             console.log('res.state.:', res.currentState.toString()); 
            res.approvalsCount = res.approvalsCount.toString();
            res.requestValue =  Web3.utils.fromWei(res.requestValue, 'ether'),
            res.goalAmount = Web3.utils.fromWei(res.goalAmount, 'ether'),
            res.currentAmount = Web3.utils.fromWei(res.currentAmount, 'ether'),
            console.log('res.goalAmount.:', res.goalAmount),
            console.log('res.currentAmount.:', res.currentAmount),
            res.raised = (res.currentAmount * 100) / res.goalAmount,
            timeleft = (new Date(res.deadline* 1000)).getTime()  - now,
            res.day = Math.floor(timeleft / (1000 * 60 * 60 * 24));
            res.hour = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            res.minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
            //var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
            res.deadline = (new Date(res.deadline* 1000)).getDate(),
            res.state = res.currentState.toString(),
            res.sentToOwner = res.goalAmount - res.currentAmount,
            this.projectData.push(res);
            data.getApprovals()
              .then((res2) => {
                    console.log('res2.:', res2),
                   res.approvedRequest = res2,
                   console.log('res.approvedRequest.:', res.approvedRequest)
              });

          });
         });
        });
       });
      
    });

  }

  openDialog(data: any, index) {
    const dialogRef = this.dialog.open(InvestmentContractDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result) {
      const dialogRef = this.dialog.open(InvestmentDialogComponent, {
        width: '250px',
        backdropClass: 'custom-dialog-backdrop-class',
        panelClass: 'custom-dialog-panel-class',
        data: { projectTitle: data.projectTitle}
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if(result){
          this.fundProject(data, result.data, index)
        }
        console.log('data received...:', result.data); 

      });
      }
    });
  }

 openDialogVote(data: any, index) {
     this.voteForProject(data, index)
}

async voteForProject(data,index) { 
  console.log(' Approving Request')
const projectContract = this.projectContractList[index]; 
  this.web3Service.artifactsToContract(project_artifacts)
    .then((ProjectAbstraction) => {
  ProjectAbstraction.at(projectContract).then((data) => {
    data.approveRequest({ 
      from: this.account
    }).then((res) => {
    console.log('res approved', res)
   
});
  });
})
}

async fundProject(data, amount, index) {
    // Operations for funding an existing crowdfunding project will be here!
    console.log('Fund project!');
     if (!amount) {
  return;
    }

    console.log('account..:', this.account)
    console.log('this.projectContractList...:', this.projectContractList)
  const projectContract = this.projectContractList[index];   
  console.log('projectContract..:', projectContract)
  this.web3Service.artifactsToContract(project_artifacts)
    .then((ProjectAbstraction) => {
  ProjectAbstraction.at(projectContract).then((data) => {
    data.contribute({ 
      from: this.account,
      value: Web3.utils.toWei(amount, 'ether'),
    }).then((res) => {
    console.log('res, event ...:', res)
});
  });
})


}

watchAccount() {
  this.web3Service.accountsObservable.subscribe((accounts) => {
    this.accounts = accounts;
    this.account = accounts[0];
    console.log('account[0]..:', this.account)
   
  });
}

// newMessage() {
// }

seeDetails(imgsrc) {
  console.log(imgsrc);
  this.route.navigate(['/projectdetail']);
  this.data.changeMessage(imgsrc);
 }

}